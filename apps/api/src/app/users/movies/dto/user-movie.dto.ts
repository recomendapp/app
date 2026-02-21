import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserSummaryDto } from '../../dto/users.dto';
import { MovieCompactDto } from '../../../movies/dto/movies.dto';
import { LogMovieDto, LogMovieWithMovieDto } from '../../../movies/log/dto/log-movie.dto';
import { PaginatedResponseDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'UserMovieWithUserMovie' })
export class UserMovieWithUserMovieDto extends LogMovieDto {
  @ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
  @Expose()
  @ValidateNested()
  @Type(() => UserSummaryDto)
  user: UserSummaryDto;

  @ApiProperty({ type: () => MovieCompactDto, description: 'The movie object' })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  movie: MovieCompactDto;
}


@ApiSchema({ name: 'ListUserMovieWithMovie'})
export class ListUserMovieWithMovieDto extends PaginatedResponseDto<LogMovieWithMovieDto> {
  @ApiProperty({ type: () => [LogMovieWithMovieDto] })
  @Type(() => LogMovieWithMovieDto)
  data: LogMovieWithMovieDto[];

  constructor(partial: Partial<ListUserMovieWithMovieDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteUserMovieWithMovie'})
export class ListInfiniteUserMovieWithMovieDto extends CursorPaginatedResponseDto<LogMovieWithMovieDto> {
  @ApiProperty({ type: () => [LogMovieWithMovieDto] })
  @Type(() => LogMovieWithMovieDto)
  data: LogMovieWithMovieDto[];

  constructor(partial: Partial<ListInfiniteUserMovieWithMovieDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}