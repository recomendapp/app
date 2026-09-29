import { Module } from '@nestjs/common';
import { InternalVersionPolicyController } from './internal-version-policy.controller';
import { InternalVersionPolicyGuard } from './internal-version-policy.guard';
import { SystemModule } from '../../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [InternalVersionPolicyController],
  providers: [InternalVersionPolicyGuard],
})
export class InternalVersionPolicyModule {}
