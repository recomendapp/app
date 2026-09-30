import { Module } from '@nestjs/common';
import { InternalImportsModule } from './imports/internal-imports.module';
import { InternalVersionPolicyModule } from './version-policy/internal-version-policy.module';

@Module({
  imports: [InternalImportsModule, InternalVersionPolicyModule],
})
export class InternalModule {}
