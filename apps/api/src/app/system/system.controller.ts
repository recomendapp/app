import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatusDto } from './dto/status.dto';

@ApiTags('System')
@Controller({
  version: '1',
})
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  @ApiOkResponse({
    description: 'Get the current system status',
    type: StatusDto,
  })
  getStatus(): Promise<StatusDto> {
    return this.systemService.getStatus();
  }
}
