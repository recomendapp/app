import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { ImportsService } from './imports.service';
import {
  ImportJobDto,
  ListInfiniteImportJobsDto,
  ListPaginatedImportJobsDto,
} from './dto/imports.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination.dto';

@ApiTags('Imports')
@Controller({ path: 'imports', version: '1' })
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

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
}
