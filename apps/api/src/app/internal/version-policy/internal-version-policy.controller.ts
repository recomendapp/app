import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SystemService } from '../../system/system.service';
import { UpdateVersionPolicyDto } from './internal-version-policy.dto';
import { InternalVersionPolicyGuard } from './internal-version-policy.guard';

@ApiExcludeController()
@Controller({ path: 'internal/version-policy', version: '1' })
@UseGuards(InternalVersionPolicyGuard)
export class InternalVersionPolicyController {
  constructor(private readonly systemService: SystemService) {}

  @Post()
  async report(@Body() dto: UpdateVersionPolicyDto): Promise<void> {
    return this.systemService.updateVersionPolicy(dto.platform, dto.version, dto.isBreaking);
  }
}
