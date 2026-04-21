import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentSession } from '../../auth/decorators';
import { Session } from '../../auth/auth.service';
import { MePushTokensService } from './me-push-tokens.service';
import { PushTokenSetDto } from './me-push-tokens.dto';

@ApiTags('Me')
@Controller({
  path: 'me/push-token',
  version: '1',
})
export class MePushTokensController {
  constructor(private readonly pushTokensService: MePushTokensService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Register or update a push token for the current user',
  })
  async set(
    @CurrentSession() session: Session,
    @Body() dto: PushTokenSetDto,
  ): Promise<PushTokenSetDto> {
    return this.pushTokensService.set({
      session,
      dto,
    });
  }
}