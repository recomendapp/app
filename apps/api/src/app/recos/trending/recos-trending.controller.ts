import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RecosTrendingService } from './recos-trending.service';
import { ListInfiniteRecosTrendingDto, ListInfiniteRecosTrendingQueryDto, ListPaginatedRecosTrendingDto, ListPaginatedRecosTrendingQueryDto } from './dto/recos-trending.dto';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Recos')
@Controller({
  path: 'recos/trending',
  version: '1',
})
export class RecosTrendingController {
  constructor(private readonly recosTrendingService: RecosTrendingService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Get paginated list of the most recommended movies and TV series over the last 30 days',
    type: ListPaginatedRecosTrendingDto,
  })
  async listPaginated(
    @Query() query: ListPaginatedRecosTrendingQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedRecosTrendingDto> {
    return this.recosTrendingService.listPaginated({
      query,
      locale,
    });
  }

  @Get('infinite')
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of the most recommended media over the last 30 days',
    type: ListInfiniteRecosTrendingDto,
  })
  async listInfinite(
    @Query() query: ListInfiniteRecosTrendingQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteRecosTrendingDto> {
    return this.recosTrendingService.listInfinite({
      query,
      locale,
    });
  }
}