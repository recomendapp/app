import { Controller, Param, ParseIntPipe, ParseEnumPipe, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { RecoTargetsService } from './reco-targets.service';
import { ListAllRecoTargetsQueryDto, ListInfiniteRecoTargetsDto, ListInfiniteRecoTargetsQueryDto, ListPaginatedRecoTargetsDto, ListPaginatedRecoTargetsQueryDto } from './dto/reco-targets.dto';
import { AuthGuard } from '../../auth/guards';
import { MediaExistsGuard } from '../../../common/guards/media-exists.guard';
import { RecoType } from '../dto/recos.dto';

@ApiTags('Recos')
@Controller({
  path: 'reco/:type/:media_id/targets',
  version: '1',
})
export class RecoTargetsController {
  constructor(private readonly recoTargetsService: RecoTargetsService) {}

  @Get()
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({ type: ListInfiniteRecoTargetsDto })
  async listAll(
    @Param('type', new ParseEnumPipe(RecoType)) type: RecoType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Query() query: ListAllRecoTargetsQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.recoTargetsService.listAll({
      currentUser,
      type,
      mediaId,
      query
    });
  }

  @Get('paginated')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({ type: ListPaginatedRecoTargetsDto })
  async listPaginated(
    @Param('type', new ParseEnumPipe(RecoType)) type: RecoType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Query() query: ListPaginatedRecoTargetsQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.recoTargetsService.listPaginated({
      currentUser,
      type,
      mediaId,
      query
    });
  }

  @Get('infinite')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({ type: ListInfiniteRecoTargetsDto })
  async listInfinite(
    @Param('type', new ParseEnumPipe(RecoType)) type: RecoType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Query() query: ListInfiniteRecoTargetsQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.recoTargetsService.listInfinite({
      currentUser,
      type,
      mediaId,
      query
    });
  }
}