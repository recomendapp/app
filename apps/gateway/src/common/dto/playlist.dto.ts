import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsBoolean,
  Min,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsISO8601,
  IsUrl,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { Profile } from './profile.dto';

export type PlaylistType = 'movie' | 'tv_series';

@Exclude()
export class Playlist {
  @ApiProperty({
    description: 'The unique identifier of the playlist',
    example: 461,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'The timestamp of when the playlist was created',
    example: '2025-11-18T17:26:00.26892+00:00',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsISO8601()
  @IsNotEmpty()
  created_at: string;

  @ApiProperty({
    description: 'The timestamp of when the playlist was last updated',
    example: '2025-11-29T10:37:53.649544+00:00',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsISO8601()
  updated_at: string | null;

  @ApiProperty({
    description: 'The ID of the user who owns the playlist',
    example: 'f022c2ec-f97c-4c20-888c-afd801b4b1d4',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'The title of the playlist',
    example: 'Where cats shine',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The description of the playlist',
    example: null,
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: 'URL to the playlist poster image',
    example:
      'https://supabase.recomend.app/storage/v1/object/public/playlist_posters/461.5d7012cf-6b8b-432b-adad-a19884ef3f56.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  poster_url?: string | null;

  @ApiProperty({
    description: 'Indicates if the playlist is private',
    example: false,
    type: Boolean,
    nullable: false,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  private: boolean;

  @ApiProperty({
    description: 'The number of items in the playlist',
    example: 15,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  items_count: number;

  @ApiProperty({
    description: 'The number of times the playlist has been saved',
    example: 3,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  saved_count: number;

  @ApiProperty({
    description: 'The number of likes the playlist has received',
    example: 7,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  likes_count: number;

  @ApiProperty({
    description: 'The type of the playlist',
    enum: ['movie', 'tv_series'],
    example: 'movie',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsEnum(['movie', 'tv_series'])
  @IsNotEmpty()
  type: PlaylistType;

  @ApiProperty({ type: () => Profile, description: 'The user object' })
  @Expose()
  @ValidateNested()
  @Type(() => Profile)
  user: Profile;
}
