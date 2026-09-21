import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { parseResponseDto } from '../../../utils/parse-response-dto';
import { importSource } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { ImportSourceDto } from './import-sources.dto';

@Injectable()
export class ImportSourcesService {
  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

  async listAll(): Promise<ImportSourceDto[]> {
    const rows = await this.db.query.importSource.findMany({
      orderBy: [asc(importSource.position)],
      with: { provider: true },
    });

    return rows.map((row) =>
      parseResponseDto(ImportSourceDto, {
        provider: row.provider,
        instructions: row.instructions,
        fileTypes: row.fileTypes,
        enabled: row.enabled,
      }),
    );
  }
}
