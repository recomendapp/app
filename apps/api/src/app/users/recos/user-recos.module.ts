import { Module } from '@nestjs/common';
import { UserRecosService } from './user-recos.service';
import { UserRecosController } from './user-recos.controller';
import { UserRecosTool } from './user-recos.tool';

@Module({
  controllers: [UserRecosController, UserRecosTool],
  providers: [UserRecosService],
  exports: [UserRecosService],
})
export class UserRecosModule {}
