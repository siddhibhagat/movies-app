import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { SearchMoviesDto } from './dto/search-movies.dto';

@Controller('api/movies')
export class MoviesController {
    private readonly logger = new Logger(MoviesController.name);

    constructor(private movieService: MoviesService) { }

    @Post('/insertData')
    async dataInsertion() {
        try {
            const result = await this.movieService.insertDataIntoDB();
            return result;
        } catch (error) {
            this.logger.error('Error in insertMovies endpoint:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/search')
    async searchMovies(@Query() params: SearchMoviesDto) {
        try {
            const result = await this.movieService.searchMovies(params);

            return result;
        } catch (error) {
            this.logger.error('Error in search endpoint:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


