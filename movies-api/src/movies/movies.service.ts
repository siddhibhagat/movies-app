import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Movie } from './schemas/movie.schema';
import { Model } from 'mongoose';
import axios from 'axios';
import { ElasticsearchSearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class MoviesService {
    private readonly logger = new Logger(MoviesService.name);

    constructor(
        @InjectModel(Movie.name) private movieModel: Model<Movie>,
        private readonly elasticsearchSearchService: ElasticsearchSearchService
    ) { }

    async insertDataIntoDB() {
        try {
            const maxResultsPerPage = 10;
            const fetchMoviesListURL = `http://www.omdbapi.com/`
            const queryParams = {
                s: 'space',  // Search term
                y: '2020',
                page: '1',
                type: 'movie',
                apikey: process.env.OMDB_API_KEY
            }
            // Fetch movies from OMDb API
            const response = await axios.get(fetchMoviesListURL, {
                params: queryParams
            });

            if (response.status !== 200 || response.data.Response === 'False') {
                throw new HttpException(
                    `OMDb API Error: ${response.data.Error || 'Failed to fetch data'}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const allResults = [...response.data.Search]; // To store all the results
            const totalResults = response?.data?.totalResults;
            const totalPages = Math.ceil(totalResults / maxResultsPerPage); // calculate number of pages

            for (let page = 2; page <= totalPages; page++) {
                try {
                    const paginatedResponse = await axios.get(fetchMoviesListURL, {
                        params: {
                            ...queryParams,
                            page: page
                        }
                    });

                    if (paginatedResponse.status === 200 && paginatedResponse.data.Response === 'True') {
                        allResults.push(...(paginatedResponse.data.Search || []));
                    } else {
                        this.logger.warn(`OMDb API Error on page ${page}: ${paginatedResponse.data.Error}`);
                    }
                } catch (error) {
                    this.logger.error(`Error fetching page ${page}: ${error.message}`);
                }
            }

            // fetching complete movie details
            const detailedMovieData = allResults.map(async (movie) => {
                const detailedData = await axios.get(fetchMoviesListURL, {
                    params: {
                        i: movie.imdbID,
                        apikey: process.env.OMDB_API_KEY
                    }
                })
                if (detailedData.status !== 200 || detailedData.data.Response === 'False') {
                    throw new HttpException(
                        `OMDb API Error: ${detailedData.data.Error || 'Failed to fetch details'}`,
                        HttpStatus.BAD_REQUEST
                    );
                }

                const movieDetails = {
                    title: detailedData.data.Title,
                    year: detailedData.data.Year,
                    director: detailedData.data.Director,
                    plot: detailedData.data.Plot,
                    poster: detailedData.data.Poster,
                    imdbID: movie.imdbID
                };

                return movieDetails;
            });

            const finalMovieList = await Promise.all(detailedMovieData);

            if (finalMovieList.length === 0) {
                throw new HttpException('No valid movie data found to insert', HttpStatus.NO_CONTENT);
            }

            // inserting data in DB
            const dataInsertedIntoDB = await this.movieModel.create(finalMovieList);

            // Index each movie in Elasticsearch
            for (const movie of finalMovieList) {
                await this.elasticsearchSearchService.indexMovie(movie);
            }

            return { data: dataInsertedIntoDB }
        } catch (error) {
            this.logger.error('Error while inserting data:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    paginationData(page: number, limit: number, totalCount: number) {
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalCount / limit);

        return { skip, totalPages }
    }

    async searchMovies(params) {
        try {
            console.log('params', params);
            const searchTerm = params?.term || '';
            const page = Number(params?.page) || 1;
            const limit = Number(params?.limit) || 10;

            let moviesCount = await this.movieModel.countDocuments();

            if (moviesCount === 0) {
                console.log('inserting data in primary db');
                // insert data in DB using OMDB api
                await this.insertDataIntoDB();
            }

            // First try to search in Elasticsearch
            let result = await this.elasticsearchSearchService.searchMovies(
                searchTerm,
                page,
                limit,
            );

            const searchedMoviesCount = await this.movieModel.countDocuments({
                $text: { $search: searchTerm }  // Full-text search on title, director, and plot
            });


            // fallback if if we dont get any result in elastic search
            if (result.totalRecords === 0 || !result.data || result.data.length === 0) {

                this.logger.warn('Elasticsearch returned no results, falling back to MongoDB');

                const { skip, totalPages } = this.paginationData(page, limit, searchedMoviesCount);

                const searchedMovies = await this.movieModel.find({
                    $text: { $search: searchTerm }  // Full-text search on title, director, and plot
                }).skip(skip).limit(limit);

                result = {
                    data: searchedMovies,
                    totalPages: totalPages,
                    currentPage: page,
                    totalRecords: searchedMoviesCount,
                }
            }

            if (result?.totalRecords !== 0 && page > result?.totalPages) {
                throw new HttpException('Page number exceeded total page count', HttpStatus.NOT_FOUND);
            }

            return result;
        } catch (error) {
            this.logger.error('Error while seaching movies:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
