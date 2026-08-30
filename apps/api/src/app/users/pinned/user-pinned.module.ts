import { Module } from '@nestjs/common';
import { UserPinnedService } from './user-pinned.service';
import { UserPinnedController } from './user-pinned.controller';

@Module({
  controllers: [UserPinnedController],
  providers: [UserPinnedService],
  exports: [UserPinnedService],
})
export class UserPinnedModule {}
