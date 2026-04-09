import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsString, ValidateNested } from 'class-validator';
import { PersonCompactDto } from '../../persons/dto/persons.dto';

@ApiSchema({ name: 'MovieRole' })
export class MovieRoleDto {
  @ApiProperty()
  @Expose()
  @IsString()
  character!: string;

  @ApiProperty()
  @Expose()
  @IsInt()
  order!: number;
}

@ApiSchema({ name: 'MovieCasting' })
export class MovieCastingDto {
  @ApiProperty()
  @Expose()
  @IsInt()
  movieId!: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  personId!: number;

  @ApiProperty({ description: 'The primary ordering index for this actor' })
  @Expose()
  @IsInt()
  order!: number;

  @ApiProperty({ type: () => PersonCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => PersonCompactDto)
  person!: PersonCompactDto;

  @ApiProperty({ type: () => [MovieRoleDto] })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MovieRoleDto)
  roles!: MovieRoleDto[];
}