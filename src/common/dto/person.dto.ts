import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsInt, IsString, IsOptional, IsUrl, IsNumber } from 'class-validator';

@Exclude()
export class PersonDto {
  @ApiProperty({ description: "The person's unique identifier" })
  @Expose()
  @IsInt()
  id: number;

  @ApiPropertyOptional({ description: "The person's name" })
  @Expose()
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ description: "The person's profile image path" })
  @Expose()
  @IsOptional()
  @IsString()
  profile_path?: string | null;

  @ApiPropertyOptional({ description: "The person's profile image URL" })
  @Expose()
  @IsOptional()
  @IsUrl()
  profile_url?: string | null;

  @ApiPropertyOptional({ description: "The person's birthday" })
  @Expose()
  @IsOptional()
  @IsString()
  birthday?: string | null;

  @ApiPropertyOptional({ description: "The person's deathday" })
  @Expose()
  @IsOptional()
  @IsString()
  deathday?: string | null;

  @ApiPropertyOptional({ description: "The person's homepage URL" })
  @Expose()
  @IsOptional()
  @IsUrl()
  homepage?: string | null;

  @ApiPropertyOptional({ description: "The person's imdb identifier" })
  @Expose()
  @IsOptional()
  @IsString()
  imdb_id?: string | null;

  @ApiPropertyOptional({ description: "The person's kown for department" })
  @Expose()
  @IsOptional()
  @IsString()
  known_for_department?: string | null;

  @ApiPropertyOptional({ description: "The person's place of birth" })
  @Expose()
  @IsOptional()
  @IsString()
  place_of_birth?: string | null;

  @ApiPropertyOptional({ description: "The person's gender" })
  @Expose()
  @IsOptional()
  @IsNumber()
  gender?: number | null;

  @ApiPropertyOptional({ description: "The person's biography" })
  @Expose()
  @IsOptional()
  @IsString()
  biography?: string | null;

  @ApiPropertyOptional({ description: "The person's popularity score" })
  @Expose()
  @IsOptional()
  @IsNumber()
  popularity?: number | null;

  @ApiPropertyOptional({ description: "The person's slug" })
  @Expose()
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({ description: "The person's URL" })
  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string | null;
}
