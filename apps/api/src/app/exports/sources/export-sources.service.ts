import { Injectable } from '@nestjs/common';
import { ImportSourceDto } from '../../imports/sources/import-sources.dto';

@Injectable()
export class ExportSourcesService {
  // No export_source table yet — import_source used to double as both directions via a
  // `direction` column, now split so import_source is import-only. Once exports are actually
  // implemented, add an export_source table mirroring import_source's shape (provider FK +
  // instructions/fileTypes/enabled/position) and query it here the same way
  // ImportSourcesService does.
  async listAll(): Promise<ImportSourceDto[]> {
    return [];
  }
}
