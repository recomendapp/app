import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReviewTvSeriesDto {
  @ApiProperty({
    description:
      'The unique identifier for the TV series review (same as user_activity_tv_series_id).',
    type: Number,
    format: 'int64',
    example: 98765,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Timestamp when the review was created.',
    type: String,
    format: 'date-time',
    example: '2023-11-15T09:00:00Z',
  })
  @IsDateString()
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when the review was last updated.',
    type: String,
    format: 'date-time',
    example: '2023-11-15T10:15:00Z',
  })
  @IsDateString()
  updated_at: string;

  @ApiProperty({
    description: 'Optional title of the review (max 50 characters).',
    type: String,
    maxLength: 50,
    nullable: true,
    example: 'Captivating TV series!',
  })
  @IsString()
  @MaxLength(50)
  title: string | null;

  @ApiProperty({
    description: 'Number of times the review has been viewed.',
    type: Number,
    format: 'int64',
    example: 200,
  })
  @IsInt()
  views_count: number;

  @ApiProperty({
    description: 'Number of likes the review has received.',
    type: Number,
    format: 'int64',
    example: 40,
  })
  @IsInt()
  likes_count: number;

  @ApiProperty({
    description: 'Number of comments on the review.',
    type: Number,
    format: 'int64',
    example: 8,
  })
  @IsInt()
  comments_count: number;

  @ApiProperty({
    description: 'The main body of the review (can contain HTML).',
    type: String,
    minLength: 1,
    example:
      '<html><p>The plot twists in this series are incredible!</p></html>',
  })
  @IsString()
  @MinLength(1)
  body: string;
}
