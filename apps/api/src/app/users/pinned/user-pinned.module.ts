import { Module } from '@nestjs/common';
import { UserPinnedService } from './user-pinned.service';
import { UserPinnedController } from './user-pinned.controller';
import { UserPinnedTool } from './user-pinned.tool';

@Module({
  controllers: [UserPinnedController, UserPinnedTool],
  providers: [UserPinnedService],
  exports: [UserPinnedService],
})
export class UserPinnedModule {}
