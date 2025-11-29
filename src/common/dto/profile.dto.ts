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
export class Profile {
  @ApiProperty({
    description: "The user's unique identifier",
    example: 'f022c2ec-f97c-4c20-888c-afd801b4b1d4',
  })
  @Expose()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: "The user's username", example: 'loup' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: "The user's full name", example: 'loup' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiPropertyOptional({
    description: "The user's biography",
    example: 'ive created this app',
  })
  @Expose()
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({
    description: "URL to the user's avatar",
    example:
      'https://supabase.recomend.app/storage/v1/object/public/avatars/f022c2ec-f97c-4c20-888c-afd801b4b1d4-0.8722010539389327.jpg',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  avatar_url?: string | null;

  @ApiPropertyOptional({
    description: "URL to the user's website",
    example: 'https://instagram.com/xmesky',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  website?: string | null;

  @ApiPropertyOptional({
    description: "The user's favorite color",
    example: '#03befc',
  })
  @Expose()
  @IsOptional()
  @IsString()
  favorite_color?: string | null;

  @ApiProperty({ description: 'The number of followers', example: 16 })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  followers_count: number;

  @ApiProperty({
    description: 'The number of users this user is following',
    example: 7,
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  following_count: number;

  @ApiPropertyOptional({
    description: "URL to the user's background image",
    example: null,
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  background_url?: string | null;

  @ApiProperty({
    description: 'Indicates if the user has a premium account',
    example: false,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  premium: boolean;

  @ApiProperty({
    description: 'Indicates if the user profile is private',
    example: false,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  private: boolean;

  @ApiProperty({
    description: 'Indicates if the user profile is visible',
    example: true,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  visible: boolean;

  @ApiProperty({
    description: 'The timestamp of when the user was created',
    example: '2024-01-06T11:51:53.474906+00:00',
  })
  @Expose()
  @IsISO8601()
  @IsNotEmpty()
  created_at: string;
}
