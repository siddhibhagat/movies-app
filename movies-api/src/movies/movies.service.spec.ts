import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { getModelToken } from '@nestjs/mongoose';
import { Movie } from './schemas/movie.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ElasticsearchSearchService } from '../elasticsearch/elasticsearch.service';

// Mock the ElasticsearchSearchService
jest.mock('../elasticsearch/elasticsearch.service');
const MockElasticsearchSearchService = jest.fn(() => ({
  // Mock methods of ElasticsearchSearchService
  searchMovies: jest.fn(),
  indexMovie: jest.fn()
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MoviesService', () => {
  let service: MoviesService;
  let movieModelMock: any;
  let elasticsearchSearchServiceMock: any;

  beforeEach(async () => {
    movieModelMock = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };

    elasticsearchSearchServiceMock = {
      indexMovie: jest.fn(),
      searchMovies: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getModelToken(Movie.name),
          useValue: movieModelMock,
        },
        {
          provide: ElasticsearchSearchService,
          useValue: elasticsearchSearchServiceMock,  // Correctly provided mock service
        },
        // {
        //   provide: ElasticsearchSearchService,
        //   useValue: {
        //     // Mock the methods of ElasticsearchSearchService here, if necessary
        //     indexMovie: jest.fn(),
        //     searchMovies: jest.fn(),
        //     // Add other methods that MoviesService uses
        //   },
        // },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('insertDataIntoDB', () => {
    it('should insert data into DB successfully', async () => {
      // Mock axios response for getting movie list
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          Response: 'True',
          Search: [{ imdbID: '1' }],
          totalResults: 1,
        },
      });

      // Mock axios response for getting detailed movie data
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          Title: 'Test Movie',
          Year: '2020',
          Director: 'Director',
          Plot: 'Movie plot',
          Poster: 'poster_link.jpg',
          imdbID: '1',
          Response: 'True'
        }
      });

      movieModelMock.create.mockResolvedValue([{ imdbID: '1', title: 'Test Movie', director: 'Director', year: 2020, poster: 'poster_link.jpg', plot: 'Movie plot' }]);

      const result = await service.insertDataIntoDB();

      // Check that movieModel.create was called with the expected data
      expect(movieModelMock.create).toHaveBeenCalledWith([
        {
          imdbID: '1',
          title: 'Test Movie',
          director: 'Director',
          year: "2020",
          poster: 'poster_link.jpg',
          plot: 'Movie plot',
        },
      ]);

      // Check that ElasticsearchSearchService.indexMovie was called for each movie
      expect(elasticsearchSearchServiceMock.indexMovie).toHaveBeenCalledWith({
        imdbID: '1',
        title: 'Test Movie',
        director: 'Director',
        year: "2020",
        poster: 'poster_link.jpg',
        plot: 'Movie plot',
      });

      expect(result).toEqual({ data: [{ imdbID: '1', title: 'Test Movie', director: 'Director', year: 2020, poster: 'poster_link.jpg', plot: 'Movie plot' }] });
    });

    it('should throw an error if OMDb API fails', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          Response: 'False',
          Error: 'OMDb API Error',
        },
      });

      await expect(service.insertDataIntoDB()).rejects.toThrow(
        new HttpException('OMDb API Error: OMDb API Error', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an error for internal server failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Some error'));

      await expect(service.insertDataIntoDB()).rejects.toThrow(
        new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  // describe('getMovies', () => {
  //   it('should return movies', async () => {
  //     const mockMovies = [{ imdbID: '1', title: 'Test Movie', director: 'Director', year: 2020, poster: 'poster_link.jpg', plot: 'Movie plot' }];
  //     movieModelMock.countDocuments.mockResolvedValue(1);

  //     movieModelMock.find.mockReturnValue({
  //       skip: jest.fn().mockReturnThis(),  // Mocking skip to return the query builder itself
  //       limit: jest.fn().mockResolvedValue(mockMovies), // Mocking limit to return the actual movies data
  //     });

  //     const result = await service.getMovies({ page: 1, limit: 10 });

  //     expect(result).toEqual({
  //       data: mockMovies,
  //       totalPages: 1,
  //       currentPage: 1,
  //       totalRecords: 1,
  //     });
  //   });

  //   it('should throw an error if page exceeds total pages', async () => {
  //     movieModelMock.countDocuments.mockResolvedValue(1);
  //     await expect(service.getMovies({ page: 2, limit: 10 })).rejects.toThrow(
  //       new HttpException('Page number exceeded total page count', HttpStatus.NOT_FOUND),
  //     );
  //   });
  // });

  describe('searchMovies', () => {
    beforeEach(() => {
      // Clear all previous mock calls
      elasticsearchSearchServiceMock.searchMovies.mockClear();
      movieModelMock.find.mockClear();
      movieModelMock.countDocuments.mockClear();
    });
    it('should return searched movies from fallback MongoDB', async () => {
      const mockMovies = [
        { imdbID: '1', title: 'Space Movie', director: 'Director', poster: 'poster_link.jpg', plot: 'Movie plot' },
        { imdbID: '2', title: 'Another Movie', director: 'Another Director', poster: 'poster_link.jpg', plot: 'Movie plot' },
      ];

      movieModelMock.countDocuments.mockResolvedValue(1);

      // Mock Elasticsearch to return no results (it will fall back to MongoDB)
      elasticsearchSearchServiceMock.searchMovies.mockResolvedValue({
        data: [],
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
      });

      // Mock find to return the filtered movies (those that match 'Space')
      const findMock = jest.fn().mockReturnThis();  // This is necessary to chain skip/limit
      movieModelMock.find.mockReturnValue({
        skip: findMock.mockReturnThis(),  // Mock skip to allow chaining
        limit: jest.fn().mockResolvedValue(mockMovies.filter(movie => movie.title.includes('Space'))),  // Mock limit to return the actual movies data
      });

      const result = await service.searchMovies({ term: 'space', page: 1, limit: 10 });

      expect(result).toEqual({
        data: [mockMovies[0]],
        totalPages: 1,
        currentPage: 1,
        totalRecords: 1,
      });
    });

    it('should return searched movies from Elasticsearch and not fallback to MongoDB', async () => {
      // Mock Elasticsearch data
      const mockMovies = [
        { imdbID: '1', title: 'Space Movie', director: 'Director', poster: 'poster_link.jpg', plot: 'Movie plot' },
        { imdbID: '2', title: 'Another Movie', director: 'Another Director', poster: 'poster_link.jpg', plot: 'Movie plot' },
      ];

      // Mock Elasticsearch to return matching results (Movies with the term "Space" in the title)
      elasticsearchSearchServiceMock.searchMovies.mockResolvedValue({
        data: [mockMovies[0]], // Only return the 'Space Movie'
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
      });

      // Make sure the MongoDB fallback isn't called
      movieModelMock.find.mockReturnValue({ skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) });

      const result = await service.searchMovies({ term: 'space', page: 1, limit: 10 });

      // Check if the result returned is from Elasticsearch and the MongoDB fallback was not called
      expect(result).toEqual({
        data: [mockMovies[0]], // Elasticsearch returned the matching movie
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
      });

      // Check if the MongoDB find method was not called, as Elasticsearch should have returned results
      expect(movieModelMock.find).not.toHaveBeenCalled();
    });
  });
});
