import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { MeService } from './me.service';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { UpdateUserDto, UserDto } from '../users/dto/users.dto';

@ApiTags('Me')
@Controller({
  path: 'me',
  version: '1',
})
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiExtraModels(UserDto)
  @ApiOkResponse({
    description: 'Get the current logged-in user information, null if not authenticated',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(UserDto) }
      ]
    }
  })
  async get(
    @CurrentOptionalUser() user: User | null,
  ): Promise<UserDto | null> {
    if (!user) return null;
    return this.meService.get(user);
  }

  @Patch()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Update the current logged-in user information',
    type: UserDto,
  })
  async update(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.meService.update(user, dto);
  }
}