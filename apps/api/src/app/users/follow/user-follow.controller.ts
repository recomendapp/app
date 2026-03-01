import { Controller, UseGuards, Get, Param, ParseUUIDPipe, Post, Delete } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UserFollowService } from './user-follow.service';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { FollowDto } from './dto/user-follow.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/follow',
  version: '1',
})
export class UserFollowController {
  constructor(private readonly followService: UserFollowService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiExtraModels(FollowDto)
  @ApiOkResponse({
    description: 'Get follow relationship with the target user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(FollowDto) }
      ]
    }
  })
  async get(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto | null> {
    return this.followService.get({
      currentUserId: currentUser.id,
      targetUserId,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Follow a user',
    type: FollowDto,
  })
  async set(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto> {
    return this.followService.set({
      currentUserId: currentUser.id,
      targetUserId,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unfollow a user',
    type: FollowDto,
  })
  async delete(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto> {
    return this.followService.delete({
      currentUserId: currentUser.id,
      targetUserId,
    });
  }

  @Post('accept')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Accept a follow request',
    type: FollowDto,
  })
  async accept(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto> {
    return this.followService.accept({
      currentUserId: currentUser.id,
      targetUserId,
    });
  }

  @Post('decline')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Decline a follow request',
    type: FollowDto,
  })
  async decline(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto> {
    return this.followService.decline({
      currentUserId: currentUser.id,
      targetUserId,
    });
  }
}