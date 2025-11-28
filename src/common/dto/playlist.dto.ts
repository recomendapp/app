import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsISO8601,
  IsUrl,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ProfileDto } from './profile.dto';

export type PlaylistType = 'movie' | 'tv_series';

@Exclude()
export class PlaylistDto {
  @ApiProperty({ description: 'The unique identifier of the playlist' })
  @Expose()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'The timestamp of when the playlist was created',
  })
  @Expose()
  @IsISO8601()
  @IsNotEmpty()
  created_at: string;

  @ApiPropertyOptional({
    description: 'The timestamp of when the playlist was last updated',
  })
  @Expose()
  @IsISO8601()
  @IsOptional()
  updated_at: string | null;

  @ApiProperty({ description: 'The ID of the user who owns the playlist' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ description: 'The title of the playlist' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'The description of the playlist' })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'URL to the playlist poster image' })
  @Expose()
  @IsOptional()
  @IsUrl()
  poster_url?: string | null;

  @ApiProperty({ description: 'Indicates if the playlist is private' })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  private: boolean;

  @ApiProperty({ description: 'The number of items in the playlist' })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  items_count: number;

  @ApiProperty({
    description: 'The number of times the playlist has been saved',
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  saved_count: number;

  @ApiProperty({ description: 'The number of likes the playlist has received' })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  likes_count: number;

  @ApiProperty({
    description: 'The type of the playlist',
    enum: ['movie', 'tv_series'],
  })
  @Expose()
  @IsEnum(['movie', 'tv_series'])
  @IsNotEmpty()
  type: PlaylistType;

  @ApiProperty({ type: () => ProfileDto, description: 'The user object' })
  @Expose()
  @ValidateNested()
  @Type(() => ProfileDto)
  user: ProfileDto;
}
