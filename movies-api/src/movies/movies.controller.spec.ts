import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const serviceMock = {
    searchMovies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchMovies', () => {
    it('should return searched movies', async () => {
      const mockMovies = [{ imdbID: '1', title: 'Space Movie', director: 'Director', year: 2020, poster: 'poster_link.jpg', plot: 'Movie plot' }];
      serviceMock.searchMovies.mockResolvedValue({
        data: mockMovies,
        totalPages: 1,
        currentPage: 1,
        totalRecords: 1,
      });

      const result = await controller.searchMovies({ term: 'space', page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockMovies,
        totalPages: 1,
        currentPage: 1,
        totalRecords: 1,
      });
    });

    it('should throw 404 if search page exceeds total pages', async () => {
      serviceMock.searchMovies.mockRejectedValue(
        new HttpException('Page number exceeded total page count', HttpStatus.NOT_FOUND),
      );

      await expect(controller.searchMovies({ term: 'space', page: 2, limit: 10 })).rejects.toThrow(
        new HttpException('Page number exceeded total page count', HttpStatus.NOT_FOUND),
      );
    });
  });
});
