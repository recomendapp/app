import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserSummaryDto } from '../dto/users.dto';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { LogMovieDto, LogMovieWithMovieNoReviewDto } from '../../movies/logs/log-movie.dto';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'UserMovieWithUserMovie' })
export class UserMovieWithUserMovieDto extends LogMovieDto {
  @ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
  @Expose()
  @ValidateNested()
  @Type(() => UserSummaryDto)
  user!: UserSummaryDto;

  @ApiProperty({ type: () => MovieCompactDto, description: 'The movie object' })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  movie!: MovieCompactDto;
}


@ApiSchema({ name: 'ListPaginatedUserMoviesWithMovie'})
export class ListPaginatedUserMoviesWithMovieDto extends PaginatedResponseDto<LogMovieWithMovieNoReviewDto> {
  @ApiProperty({ type: () => [LogMovieWithMovieNoReviewDto] })
  @Type(() => LogMovieWithMovieNoReviewDto)
  data!: LogMovieWithMovieNoReviewDto[];

  constructor(partial: Partial<ListPaginatedUserMoviesWithMovieDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteUserMoviesWithMovie'})
export class ListInfiniteUserMoviesWithMovieDto extends CursorPaginatedResponseDto<LogMovieWithMovieNoReviewDto> {
  @ApiProperty({ type: () => [LogMovieWithMovieNoReviewDto] })
  @Type(() => LogMovieWithMovieNoReviewDto)
  data!: LogMovieWithMovieNoReviewDto[];

  constructor(partial: Partial<ListInfiniteUserMoviesWithMovieDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}