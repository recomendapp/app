import { Module } from '@nestjs/common';
import { PersonMetadataService } from './person-metadata.service';
import { PersonMetadataController } from './person-metadata.controller';

@Module({
  controllers: [PersonMetadataController],
  providers: [PersonMetadataService],
  exports: [PersonMetadataService],
})
export class PersonMetadataModule {}
