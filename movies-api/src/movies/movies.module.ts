import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schemas/movie.schema';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { ElasticsearchSearchService } from '../elasticsearch/elasticsearch.service';
import { ElasticsearchSearchModule } from '../elasticsearch/elasticsearch.module';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        ElasticsearchModule.register({
            node: process.env.ELASTICSEARCH_URI, // URL of your Elasticsearch instance
        }),
        ElasticsearchSearchModule
    ],
    providers: [MoviesService, ElasticsearchSearchService],
    controllers: [MoviesController]
})
export class MoviesModule { }
