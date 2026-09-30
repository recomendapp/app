import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';
import { apiException } from '../../common/dto/api-error.dto';
import { SystemService } from './system.service';
import { UpgradeRequiredErrorDto } from './dto/upgrade-required-error.dto';

@Injectable()
export class AppVersionMiddleware implements NestMiddleware {
  constructor(private readonly systemService: SystemService) {}

  async use(req: IncomingMessage, _res: ServerResponse, next: (error?: unknown) => void) {
    const requiredUpdate = await this.systemService.getRequiredUpdate(req.headers);
    if (requiredUpdate) {
      throw apiException(UpgradeRequiredErrorDto, {
        message: 'This app version is no longer supported, please update.',
        code: 'UPGRADE_REQUIRED',
        ...requiredUpdate,
      });
    }
    next();
  }
}
