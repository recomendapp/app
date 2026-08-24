import { Module } from '@nestjs/common';
import { InternalImportsController } from './internal-imports.controller';
import { InternalImportsGuard } from './internal-imports.guard';
import { ImportsModule } from '../../imports/imports.module';

@Module({
  imports: [ImportsModule],
  controllers: [InternalImportsController],
  providers: [InternalImportsGuard],
})
export class InternalImportsModule {}
