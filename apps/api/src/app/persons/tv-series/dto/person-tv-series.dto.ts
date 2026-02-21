import { ApiSchema, ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { TvSeriesCompactDto, TvSeriesSortBy } from '../../../tv-series/dto/tv-series.dto';

@ApiSchema({ name: 'PersonTvSeriesCredit' })
export class PersonTvSeriesCreditDto {
  @ApiProperty({ example: 'Acting' })
  @Expose()
  department: string;

  @ApiProperty({ example: 'Lead' })
  @Expose()
  job: string;
}

@ApiSchema({ name: 'PersonTvSeries' })
export class PersonTvSeriesDto {
  @ApiProperty({ type: TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  tvSeries: TvSeriesCompactDto;
  
  @ApiProperty({
    type: [PersonTvSeriesCreditDto],
    description: 'List of credits the person has for this TV series',
  })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PersonTvSeriesCreditDto)
  credits: PersonTvSeriesCreditDto[];
}

@ApiSchema({ name: 'ListPersonTvSeries'})
export class ListPersonTvSeriesDto extends PaginatedResponseDto<PersonTvSeriesDto> {
  @ApiProperty({ type: () => [PersonTvSeriesDto] })
  @Type(() => PersonTvSeriesDto)
  data: PersonTvSeriesDto[];

  constructor(partial: Partial<ListPersonTvSeriesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfinitePersonTvSeries'})
export class ListInfinitePersonTvSeriesDto extends CursorPaginatedResponseDto<PersonTvSeriesDto> {
  @ApiProperty({ type: () => [PersonTvSeriesDto] })
  @Type(() => PersonTvSeriesDto)
  data: PersonTvSeriesDto[];

  constructor(partial: Partial<ListInfinitePersonTvSeriesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'BaseListPersonTvSeriesQuery' })
class BaseListPersonTvSeriesQueryDto {
  @ApiPropertyOptional({
      description: 'Filter TV series by department (e.g. Acting, Directing)',
      example: 'Acting',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
      description: 'Filter TV series by job (e.g. Lead, Director)',
      example: 'Lead',
  })
  @IsOptional()
  @IsString()
  job?: string;

  @ApiPropertyOptional({
      description: 'Field to sort TV series by',
      default: TvSeriesSortBy.LAST_AIR_DATE,
      example: TvSeriesSortBy.LAST_AIR_DATE,
      enum: TvSeriesSortBy,
  })
  @IsOptional()
  @IsEnum(TvSeriesSortBy)
  sort_by: TvSeriesSortBy = TvSeriesSortBy.LAST_AIR_DATE;

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

@ApiSchema({ name: 'ListPersonTvSeriesQuery' })
export class ListPersonTvSeriesQueryDto extends IntersectionType(
  BaseListPersonTvSeriesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePersonTvSeriesQuery' })
export class ListInfinitePersonTvSeriesQueryDto extends IntersectionType(
  BaseListPersonTvSeriesQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'PersonTvSeriesFacetDepartment' })
export class PersonTvSeriesFacetDepartmentDto {
  @ApiProperty({ example: 'Directing', description: 'Name of the department' })
  @Expose()
  department: string;

  @ApiProperty({ example: ['Director', 'Producer'], description: 'Available jobs in this department for this person' })
  @Expose()
  jobs: string[];
}

@ApiSchema({ name: 'PersonTvSeriesFacets' })
export class PersonTvSeriesFacetsDto {
  @ApiProperty({
    type: () => [PersonTvSeriesFacetDepartmentDto],
    description: 'List of departments the person has worked in, along with available jobs in each department'
  })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PersonTvSeriesFacetDepartmentDto)
  departments: PersonTvSeriesFacetDepartmentDto[];
}