import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ProfileDto } from './dto/users.dto';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';

@ApiTags('Users')
@Controller({
  path: 'user',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':identifier')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get user profile by UUID or @username',
    type: ProfileDto,
  })
  async get(
    @Param('identifier') identifier: string,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ProfileDto> {
    return this.usersService.get(decodeURIComponent(identifier), currentUser);
  }
}