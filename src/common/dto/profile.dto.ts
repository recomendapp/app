import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  IsNotEmpty,
  IsISO8601,
  IsUrl,
  IsUUID,
} from 'class-validator';

@Exclude()
export class ProfileDto {
  @ApiProperty({ description: "The user's unique identifier" })
  @Expose()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: "The user's username" })
  @Expose()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: "The user's full name" })
  @Expose()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiPropertyOptional({ description: "The user's biography" })
  @Expose()
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({ description: "URL to the user's avatar" })
  @Expose()
  @IsOptional()
  @IsUrl()
  avatar_url?: string | null;

  @ApiPropertyOptional({ description: "URL to the user's website" })
  @Expose()
  @IsOptional()
  @IsUrl()
  website?: string | null;

  @ApiPropertyOptional({ description: "The user's favorite color" })
  @Expose()
  @IsOptional()
  @IsString()
  favorite_color?: string | null;

  @ApiProperty({ description: 'The number of followers' })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  followers_count: number;

  @ApiProperty({ description: 'The number of users this user is following' })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  following_count: number;

  @ApiPropertyOptional({ description: "URL to the user's background image" })
  @Expose()
  @IsOptional()
  @IsUrl()
  background_url?: string | null;

  @ApiProperty({ description: 'Indicates if the user has a premium account' })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  premium: boolean;

  @ApiProperty({ description: 'Indicates if the user profile is private' })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  private: boolean;

  @ApiProperty({ description: 'Indicates if the user profile is visible' })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  visible: boolean;

  @ApiProperty({ description: 'The timestamp of when the user was created' })
  @Expose()
  @IsISO8601()
  @IsNotEmpty()
  created_at: string;
}
