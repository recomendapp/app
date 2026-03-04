import { BadRequestException, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MeAvatarService } from './me-avatar.service';
import { AuthGuard } from '../../auth/guards';
import { MeAvatarUploadDto } from './dto/me-avatar.dto';
import { FastifyRequest } from 'fastify';
import { User } from '../../auth/auth.service';
import { CurrentUser } from '../../auth/decorators';
import { UserDto } from '../../users/dto/users.dto';

@ApiTags('Me')
@Controller({
  path: 'me/avatar',
  version: '1',
})
export class MeAvatarController {
  constructor(private readonly meAvatarService: MeAvatarService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar file',
    type: MeAvatarUploadDto,
  })
  @ApiOkResponse({
    description: 'Avatar updated successfully',
    type: UserDto,
  })
  async set(
    @Req() req: FastifyRequest,
    @CurrentUser() user: User,
  ): Promise<UserDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart/form-data');
    }

    const file = await req.file();
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.meAvatarService.set(user, file);
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Avatar deleted successfully',
    type: UserDto,
  })
  async delete(@CurrentUser() user: User): Promise<UserDto> {
    return this.meAvatarService.delete(user);
  }
}