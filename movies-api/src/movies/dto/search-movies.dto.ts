import { IsOptional, IsString } from 'class-validator';

export class SearchMoviesDto {
    @IsOptional()
    @IsString()
    term: string;

    @IsOptional()
    page: number;

    @IsOptional()
    limit: number;
}