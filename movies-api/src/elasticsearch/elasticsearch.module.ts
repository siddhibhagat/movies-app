import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchSearchService } from './elasticsearch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ElasticsearchModule.register({
            node: process.env.ELASTICSEARCH_URI, // URL of your Elasticsearch instance
        }),
    ],
    providers: [ElasticsearchSearchService],
    exports: [ElasticsearchSearchService],
})
export class ElasticsearchSearchModule { }
