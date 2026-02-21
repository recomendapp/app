import { ApiSchema, ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MovieCompactDto, MovieSortBy } from '../../../movies/dto/movies.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';

@ApiSchema({ name: 'PersonMovieCredit' })
export class PersonMovieCreditDto {
  @ApiProperty({ example: 'Acting' })
  @Expose()
  department: string;

  @ApiProperty({ example: 'Lead' })
  @Expose()
  job: string;
}

@ApiSchema({ name: 'PersonMovie' })
export class PersonMovieDto {
  @ApiProperty({ type: MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  movie: MovieCompactDto;
  
  @ApiProperty({
    type: [PersonMovieCreditDto],
    description: 'List of credits the person has for this movie',
  })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PersonMovieCreditDto)
  credits: PersonMovieCreditDto[];
}

@ApiSchema({ name: 'ListPersonMovies'})
export class ListPersonMoviesDto extends PaginatedResponseDto<PersonMovieDto> {
  @ApiProperty({ type: () => [PersonMovieDto] })
  @Type(() => PersonMovieDto)
  data: PersonMovieDto[];

  constructor(partial: Partial<ListPersonMoviesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfinitePersonMovies'})
export class ListInfinitePersonMoviesDto extends CursorPaginatedResponseDto<PersonMovieDto> {
  @ApiProperty({ type: () => [PersonMovieDto] })
  @Type(() => PersonMovieDto)
  data: PersonMovieDto[];

  constructor(partial: Partial<ListInfinitePersonMoviesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'BaseListPersonMoviesQuery' })
class BaseListPersonMoviesQueryDto {
  @ApiPropertyOptional({
      description: 'Filter movies by department (e.g. Acting, Directing)',
      example: 'Acting',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
      description: 'Filter movies by job (e.g. Lead, Director)',
      example: 'Lead',
  })
  @IsOptional()
  @IsString()
  job?: string;

  @ApiPropertyOptional({
      description: 'Field to sort logs by',
      default: MovieSortBy.RELEASE_DATE,
      example: MovieSortBy.RELEASE_DATE,
      enum: MovieSortBy,
  })
  @IsOptional()
  @IsEnum(MovieSortBy)
  sort_by: MovieSortBy = MovieSortBy.RELEASE_DATE;

  @ApiPropertyOptional({
      description: 'Sort order',
      default: SortOrder.DESC,
      example: SortOrder.DESC,
      enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.DESC;
}

@ApiSchema({ name: 'ListPersonMovieQuery' })
export class ListPersonMovieQueryDto extends IntersectionType(
  BaseListPersonMoviesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePersonMoviesQuery' })
export class ListInfinitePersonMoviesQueryDto extends IntersectionType(
  BaseListPersonMoviesQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'PersonMovieFacetDepartment' })
export class PersonMovieFacetDepartmentDto {
  @ApiProperty({ example: 'Directing', description: 'Name of the department' })
  @Expose()
  department: string;

  @ApiProperty({ example: ['Director', 'Producer'], description: 'Available jobs in this department for this person' })
  @Expose()
  jobs: string[];
}

@ApiSchema({ name: 'PersonMovieFacets' })
export class PersonMovieFacetsDto {
  @ApiProperty({
    type: () => [PersonMovieFacetDepartmentDto],
    description: 'List of departments the person has worked in, along with available jobs in each department'
  })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PersonMovieFacetDepartmentDto)
  departments: PersonMovieFacetDepartmentDto[];
}