import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentSession } from '../../auth/decorators';
import { Session } from '../../auth/auth.service';
import { UserPushTokensService } from './user-push-tokens.service';
import { PushTokenSetDto } from './push-tokens.dto';

@ApiTags('Users')
@Controller({
  path: 'user/me',
  version: '1',
})
export class UserPushTokensController {
  constructor(private readonly pushTokensService: UserPushTokensService) {}

  @Post('push-token')
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