import 'reflect-metadata';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsString, ValidateNested } from 'class-validator';
import { RecoTrendingDto } from '../app/recos/trending/recos-trending.dto';
import { MovieRoleDto } from '../app/movies/dto/movie-credits.dto';
import { TvSeriesRoleDto } from '../app/tv-series/dto/tv-series-credits.dto';
import { WatchedDateDto } from '../app/movies/logs/watched-dates/dto/watched-dates.dto';
import { parseResponseDto, ResponseDtoValidationError } from './parse-response-dto';

class ChildDto {
  @Expose()
  @IsInt()
  id!: number;
}

class ParentDto {
  @Expose()
  @IsString()
  name!: string;

  @Expose()
  @Type(() => ChildDto)
  @ValidateNested()
  child!: ChildDto;
}

class NullableDto {
  @ApiProperty({ nullable: true })
  @Expose()
  @IsString()
  name!: string | null;
}

class ComputedDto {
  @Expose()
  @IsInt()
  id!: number;

  @Expose()
  @Transform(({ obj }) => `/resource/${obj.id}`)
  @IsString()
  path!: string;
}

class NestedNullableDto {
  @Expose()
  @Type(() => NullableDto)
  @ValidateNested()
  value!: NullableDto;
}

describe('parseResponseDto', () => {
  it('returns a DTO when the response matches its contract', () => {
    const result = parseResponseDto(ParentDto, {
      name: 'Recomend',
      child: { id: 1 },
    });

    expect(result).toBeInstanceOf(ParentDto);
    expect(result.child).toBeInstanceOf(ChildDto);
  });

  it('throws when a required property is missing', () => {
    expect(() => parseResponseDto(ParentDto, { child: { id: 1 } })).toThrow(
      ResponseDtoValidationError,
    );
  });

  it('throws when a nested property is invalid', () => {
    expect(() => parseResponseDto(ParentDto, { name: 'Recomend', child: { id: '1' } })).toThrow(
      ResponseDtoValidationError,
    );
  });

  it('removes an undeclared source property before validating the API DTO', () => {
    const result = parseResponseDto(ParentDto, {
      name: 'Recomend',
      child: { id: 1 },
      unexpected: true,
    });

    expect(result).toEqual({ name: 'Recomend', child: { id: 1 } });
  });

  it('validates every item in an array response', () => {
    expect(() => parseResponseDto(ChildDto, [{ id: 1 }, { id: '2' }])).toThrow(
      ResponseDtoValidationError,
    );
  });

  it('accepts null when the documented response property is nullable', () => {
    expect(parseResponseDto(NullableDto, { name: null })).toEqual({ name: null });
  });

  it('does not retain an empty parent validation error for a nullable nested property', () => {
    expect(parseResponseDto(NestedNullableDto, { value: { name: null } })).toEqual({
      value: { name: null },
    });
  });

  it('adds an exposed computed property that was not selected from the source', () => {
    expect(parseResponseDto(ComputedDto, { id: 42 })).toEqual({ id: 42, path: '/resource/42' });
  });

  it('normalizes a bigint value from PostgreSQL before validating a trending media id', () => {
    expect(
      parseResponseDto(RecoTrendingDto, {
        mediaId: '157336',
        type: 'movie',
        recommendationCount: 1,
        trendingScore: 1,
      }),
    ).toMatchObject({ mediaId: 157336 });
  });

  it.each([MovieRoleDto, TvSeriesRoleDto])('accepts a role without a character', (dto) => {
    expect(parseResponseDto(dto, { character: null, order: 1 })).toEqual({
      character: null,
      order: 1,
    });
  });

  it('normalizes a watched timestamp from PostgreSQL to an ISO string', () => {
    expect(
      parseResponseDto(WatchedDateDto, {
        id: 1,
        watchedDate: new Date('2024-01-01T00:00:00.000Z'),
        format: 'theater',
        comment: null,
      }),
    ).toMatchObject({ watchedDate: '2024-01-01T00:00:00.000Z' });
  });
});
