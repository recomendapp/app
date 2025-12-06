import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReviewMovieDto {
  @ApiProperty({
    description:
      'The unique identifier for the movie review (same as user_activity_movie_id).',
    type: Number,
    format: 'int64',
    example: 12345,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Timestamp when the review was created.',
    type: String,
    format: 'date-time',
    example: '2023-10-27T10:00:00Z',
  })
  @IsDateString()
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when the review was last updated.',
    type: String,
    format: 'date-time',
    example: '2023-10-27T11:30:00Z',
  })
  @IsDateString()
  updated_at: string;

  @ApiProperty({
    description: 'Optional title of the review (max 50 characters).',
    type: String,
    maxLength: 50,
    nullable: true,
    required: false,
    example: 'A fantastic movie!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title: string | null;

  @ApiProperty({
    description: 'Number of times the review has been viewed.',
    type: Number,
    format: 'int64',
    example: 150,
  })
  @IsInt()
  views_count: number;

  @ApiProperty({
    description: 'Number of likes the review has received.',
    type: Number,
    format: 'int64',
    example: 25,
  })
  @IsInt()
  likes_count: number;

  @ApiProperty({
    description: 'Number of comments on the review.',
    type: Number,
    format: 'int64',
    example: 5,
  })
  @IsInt()
  comments_count: number;

  @ApiProperty({
    description: 'The main body of the review (can contain HTML).',
    type: String,
    minLength: 1,
    example: '<html><p>This movie was absolutely amazing!</p></html>',
  })
  @IsString()
  @MinLength(1)
  body: string;
}
