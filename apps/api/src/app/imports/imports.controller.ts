import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { ImportsService } from './imports.service';
import {
  ImportJobDto,
  ImportProvider,
  ListInfiniteImportJobsDto,
  ListPaginatedImportJobsDto,
} from './dto/imports.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination.dto';

@ApiTags('Imports')
@Controller({ path: 'imports', version: '1' })
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'provider', enum: ImportProvider })
  @ApiBody({ description: 'Provider export file (zip)' })
  @ApiOkResponse({ type: ImportJobDto })
  async create(
    @Req() req: FastifyRequest,
    @Query('provider', new ParseEnumPipe(ImportProvider)) provider: ImportProvider,
    @CurrentUser() user: User,
  ): Promise<ImportJobDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart/form-data');
    }
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importsService.create(user, provider, file);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [ImportJobDto],
    description: 'Get all import jobs for the user as a raw array',
  })
  async listAll(@CurrentUser() user: User): Promise<ImportJobDto[]> {
    return this.importsService.listAll(user);
  }

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListPaginatedImportJobsDto })
  async listPaginated(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User,
  ): Promise<ListPaginatedImportJobsDto> {
    return this.importsService.listPaginated(user, query);
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListInfiniteImportJobsDto })
  async listInfinite(
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user: User,
  ): Promise<ListInfiniteImportJobsDto> {
    return this.importsService.listInfinite(user, query);
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
