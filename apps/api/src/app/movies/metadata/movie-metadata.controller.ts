import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MovieMetadataService } from './movie-metadata.service';
import { MovieMetadataDto } from './movie-metadata.dto';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id',
  version: '1',
})
export class MovieMetadataController {
  constructor(private readonly movieMetadataService: MovieMetadataService) {}

  @Get('metadata')
  @ApiOkResponse({
    description: 'Locales that genuinely translate this movie, for the page hreflang set',
    type: MovieMetadataDto,
  })
  async get(@Param('movie_id', ParseIntPipe) movieId: number): Promise<MovieMetadataDto> {
    return this.movieMetadataService.get(movieId);
  }
}
