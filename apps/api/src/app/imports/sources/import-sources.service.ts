import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { importSource } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { ImportSourceDto } from './import-sources.dto';

@Injectable()
export class ImportSourcesService {
  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

  async listAll(): Promise<ImportSourceDto[]> {
    const rows = await this.db.query.importSource.findMany({
      where: eq(importSource.direction, 'import'),
      orderBy: [asc(importSource.position)],
    });

    return rows.map((row) => plainToInstance(ImportSourceDto, row));
  }
}
