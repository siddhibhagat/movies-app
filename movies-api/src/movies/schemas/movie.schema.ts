import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'movies', timestamps: true })
export class Movie extends Document {
  @Prop({ required: true })
  imdbID: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  director: string;

  @Prop({ required: true })
  plot: string;

  @Prop({ required: true })
  year: number;

  @Prop()
  poster: string;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

// Create text index for title, director, and plot
MovieSchema.index({ title: 'text', director: 'text', plot: 'text' });
