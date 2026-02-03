import { Module } from '@nestjs/common';
import { UsersController } from './v1/users.controller';
import { UsersService } from './v1/users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
