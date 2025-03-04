import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MoviesModule } from './movies/movies.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchSearchModule } from './elasticsearch/elasticsearch.module';
import mongoose from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Makes configuration available globally
      // envFilePath: '.env',  // Path to your .env file
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MoviesModule,
    ElasticsearchSearchModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    // Listen to Mongoose events
    mongoose.connection.on('connected', () => {
      console.log('Successfully connected to the MongoDB database!');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Error connecting to the MongoDB database:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB connection has been disconnected.');
    });
  }
}
