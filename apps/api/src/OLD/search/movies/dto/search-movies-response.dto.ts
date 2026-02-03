import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { Movie } from '../../../common/dto/movie.dto';
import { Type } from 'class-transformer';

export class SearchMoviesResponse extends PaginatedResponseDto<Movie> {
  @ApiProperty({ type: [Movie] })
  @Type(() => Movie)
  declare data: Movie[];

  constructor(partial: Partial<SearchMoviesResponse>) {
    super(partial);
    Object.assign(this, partial);
  }
}
