import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { StatusDto } from './dto/status.dto';
import { systemConfig } from '@libs/db/schemas';
import { inArray } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SystemService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async getStatus(): Promise<StatusDto> {
    const configs = await this.db.select()
      .from(systemConfig)
      .where(inArray(systemConfig.key, ['is_maintenance', 'min_mobile_version']));
    
    const isMaintenanceRecord = configs.find(c => c.key === 'is_maintenance');
    const minMobileVersionRecord = configs.find(c => c.key === 'min_mobile_version');
  
    return plainToInstance(StatusDto, {
      isMaintenance: isMaintenanceRecord ? !!isMaintenanceRecord.value : false,
      minMobileVersion: minMobileVersionRecord ? String(minMobileVersionRecord.value) : '1.0.0',
    });
  }
}
