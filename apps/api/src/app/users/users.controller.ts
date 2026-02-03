import { Controller, UseGuards, Get } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { User } from 'better-auth/types';
import { UsersService } from './users.service';
import { UserMeDto } from './dto/users.dto';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';

@ApiTags('Users')
@Controller({
  path: 'user',
  version: '1',
})
@ApiExtraModels(UserMeDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the current logged-in user information, null if not authenticated',
    schema: {
      nullable: true,
      oneOf: [
        { $ref: getSchemaPath(UserMeDto) },
        { type: 'null' },
      ],
    },
  })
  async getMe(
    @CurrentOptionalUser() user: User | null,
  ): Promise<UserMeDto | null> {
    if (!user) return null;
    return this.usersService.getMe(user);
  }
}