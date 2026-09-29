import { Body, Controller, Get, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SystemService } from '../../system/system.service';
import { UpdateVersionPolicyDto } from '../../system/dto/update-version-policy.dto';
import { VersionReleaseRefDto } from '../../system/dto/version-release.dto';
import { VersionReleaseStateDto } from '../../system/dto/version-release-state.dto';
import { InternalVersionPolicyGuard } from './internal-version-policy.guard';

// Called by mobile CI and the db-sync store-release-watch Prefect flow, never by
// end users — see InternalVersionPolicyGuard.
@ApiExcludeController()
@Controller({ path: 'internal/version-policy', version: '1' })
@UseGuards(InternalVersionPolicyGuard)
export class InternalVersionPolicyController {
  constructor(private readonly systemService: SystemService) {}

  @Post()
  async report(@Body() dto: UpdateVersionPolicyDto): Promise<void> {
    return this.systemService.updateVersionPolicy(dto.platform, dto.version, dto.isBreaking);
  }

  /** Polled by the watch flow before it checks the store, to know whether it should bother. */
  @Get('state')
  async state(@Query() query: VersionReleaseRefDto): Promise<VersionReleaseStateDto> {
    const state = await this.systemService.getVersionReleaseState(query.platform, query.version);
    if (!state) throw new NotFoundException('No such (platform, version) was ever reported');
    return state;
  }

  @Post('confirm')
  async confirm(@Body() dto: VersionReleaseRefDto): Promise<void> {
    return this.systemService.confirmVersionLive(dto.platform, dto.version);
  }
}
