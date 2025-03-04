import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Movie } from '../movies/schemas/movie.schema';

@Injectable()
export class ElasticsearchSearchService {
    private readonly logger = new Logger(ElasticsearchSearchService.name);

    constructor(private readonly elasticsearchService: ElasticsearchService) { }

    // Index movie in Elasticsearch
    async indexMovie(movie): Promise<any> {
        return this.elasticsearchService.index({
            index: 'movies',
            id: movie.imdbID,
            body: {
                imdbID: movie.imdbID,
                title: movie.title,
                director: movie.director,
                plot: movie.plot,
                poster: movie.poster,
            },
        });
    }

    // Search for movies in Elasticsearch
    async searchMovies(searchTerm: string, page: number, limit: number): Promise<any> {
        try {
            const from = (page - 1) * limit;

            // If searchTerm is empty or undefined, use a match_all query to return all documents
            const query = searchTerm ? {
                multi_match: {
                    query: searchTerm,
                    fields: ['title', 'director', 'plot'], // Fields to search
                    // fuzziness: 'AUTO',  // Apply fuzziness for minor variations
                    // fuzziness: 1, // Only allow fuzzy matches with one character difference
                    fuzziness: 0, // exact match
                    operator: 'or', // Search in any of the fields (OR condition)
                    lenient: true,
                }
            } : {
                match_all: {}
            };

            const response = await this.elasticsearchService.search({
                index: 'movies', // Specify the index name
                from,             // Starting point for the query results (pagination)
                size: limit,      // Limit the number of results
                body: {           // The body of the search query
                    query
                },
            });

            const totalRecords = response.body.hits.total.value;  // Total number of matching documents
            const totalPages = Math.ceil(totalRecords / limit);    // Calculate total pages
            const currentPage = page;                              // Current page based on input

            return {
                totalRecords,
                totalPages,
                currentPage,
                data: response.body.hits.hits.map((hit) => hit._source)  // The actual search results
            };
        } catch (error) {
            this.logger.error('Error while searching movies in elastic search:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
