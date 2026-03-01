import { Controller, Post, Param, Body, UseGuards, ParseIntPipe, ParseEnumPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { RecosService } from './recos.service';
import { RecoSendDto, RecoSendResponseDto, RecoType } from './dto/recos.dto';
import { MediaExistsGuard } from '../../common/guards/media-exists.guard';

@ApiTags('Recos')
@Controller({
  path: 'reco',
  version: '1',
})
export class RecosController {
  constructor(private readonly recosService: RecosService) {}

  @Post(':type/:media_id')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiResponse({
    status: 200,
    type: RecoSendResponseDto,
  })
  async send(
    @Param('type', new ParseEnumPipe(RecoType)) type: RecoType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Body() dto: RecoSendDto,
    @CurrentUser() user: User,
  ) {
    return this.recosService.send({
      user,
      type,
      mediaId,
      dto
    });
  }
}