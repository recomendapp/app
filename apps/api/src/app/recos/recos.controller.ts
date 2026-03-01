import { Controller, Post, Param, Body, UseGuards, ParseIntPipe, ParseEnumPipe, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { RecosService } from './recos.service';
import { RecoDto, RecoSendDto, RecoSendResponseDto, RecoType } from './dto/recos.dto';
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

  @Delete(':type/:media_id')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({
    description: 'Delete all recos for a given media that user received (only)',
    type: [RecoDto],
  })
  async deleteByMedia(
    @Param('type', new ParseEnumPipe(RecoType)) type: RecoType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @CurrentUser() user: User,
  ): Promise<RecoDto[]> {
    return this.recosService.deleteByMedia({
      user,
      type,
      mediaId,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Delete a reco by its ID. Only the sender or receiver can delete their reco.',
    type: RecoDto,
  })
  async deleteById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<RecoDto> {
    return this.recosService.deleteById({
      id,
      user,
    });
  }
}