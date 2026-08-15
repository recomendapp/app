import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { ExploreDto } from './dto/explore.dto';

@ApiTags('Explore')
@Controller({
  path: 'explore',
  version: '1',
})
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get(':identifier')
  @ApiOkResponse({
    description: 'Get an explore map by its id or slug.',
    type: ExploreDto,
  })
  async get(@Param('identifier') identifier: string): Promise<ExploreDto> {
    return this.exploreService.get(decodeURIComponent(identifier));
  }
}
