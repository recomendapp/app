import { Module } from '@nestjs/common';
import { UserRecosService } from './user-recos.service';
import { UserRecosController } from './user-recos.controller';

@Module({
  controllers: [UserRecosController],
  providers: [UserRecosService],
  exports: [UserRecosService],
})
export class UserRecosModule {}