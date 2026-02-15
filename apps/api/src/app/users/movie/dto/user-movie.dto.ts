import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserSummaryDto } from '../../dto/users.dto';
import { MovieCompactDto } from '../../../movies/dto/movies.dto';
import { LogMovieDto } from '../../../movies/log/dto/log-movie.dto';

@ApiSchema({ name: 'UserMovie' })
export class UserMovieDto extends LogMovieDto {
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