import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { ImportsService } from './imports.service';
import { ImportJobDto } from './dto/imports.dto';

@ApiTags('Imports')
@Controller({ path: 'import', version: '1' })
export class ImportController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('create/:slug')
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'slug', description: 'Provider slug, e.g. "letterboxd"' })
  @ApiBody({ description: 'Provider export file (zip)' })
  @ApiOkResponse({ type: ImportJobDto })
  async create(
    @Req() req: FastifyRequest,
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ): Promise<ImportJobDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart/form-data');
    }
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importsService.create(user, slug, file);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobDto })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ImportJobDto> {
    return this.importsService.getById(user, id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<void> {
    return this.importsService.delete(user, id);
  }

  @Post(':id/validate')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobDto })
  async validate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ImportJobDto> {
    return this.importsService.validate(user, id);
  }
}
