import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatusDto } from './dto/status.dto';
import { AppHeaders } from './app-headers.decorator';
import type { AppPlatform } from '@libs/rules';

@ApiTags('System')
@Controller({
  version: '1',
})
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  @ApiOkResponse({
    description:
      'Get the current system status: maintenance mode, and -- when the caller sent its ' +
      'app headers -- whether that app version is up to date, has an optional update ' +
      'available, or must update before it can keep using the API.',
    type: StatusDto,
  })
  getStatus(
    @AppHeaders() app: { platform: AppPlatform; version: string } | null,
  ): Promise<StatusDto> {
    return this.systemService.getStatus(app);
  }
}
