import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsBoolean,
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
    type: String,
    nullable: false,
  })
  @Expose()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "The user's username",
    example: 'loup',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: "The user's full name",
    example: 'loup',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({
    description: "The user's biography",
    example: 'ive created this app',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  bio: string | null;

  @ApiProperty({
    description: "URL to the user's avatar",
    example:
      'https://supabase.recomend.app/storage/v1/object/public/avatars/f022c2ec-f97c-4c20-888c-afd801b4b1d4-0.8722010539389327.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  avatar_url: string | null;

  @ApiProperty({
    description: "URL to the user's website",
    example: 'https://instagram.com/xmesky',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  website: string | null;

  @ApiProperty({
    description: "The user's favorite color",
    example: '#03befc',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  favorite_color: string | null;

  @ApiProperty({
    description: 'The number of followers',
    example: 16,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  followers_count: number;

  @ApiProperty({
    description: 'The number of users this user is following',
    example: 7,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  following_count: number;

  @ApiProperty({
    description: "URL to the user's background image",
    example: null,
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  background_url: string | null;

  @ApiProperty({
    description: 'Indicates if the user has a premium account',
    example: false,
    type: Boolean,
    nullable: false,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  premium: boolean;

  @ApiProperty({
    description: 'Indicates if the user profile is private',
    example: false,
    type: Boolean,
    nullable: false,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  private: boolean;

  @ApiProperty({
    description: 'Indicates if the user profile is visible',
    example: true,
    type: Boolean,
    nullable: false,
  })
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  visible: boolean;

  @ApiProperty({
    description: 'The timestamp of when the user was created',
    example: '2024-01-06T11:51:53.474906+00:00',
    type: String,
    nullable: false,
  })
  @Expose()
  @IsISO8601()
  @IsNotEmpty()
  created_at: string;
}
