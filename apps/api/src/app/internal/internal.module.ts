import { Module } from '@nestjs/common';
import { InternalImportsModule } from './imports/internal-imports.module';

@Module({
  imports: [InternalImportsModule],
})
export class InternalModule {}
