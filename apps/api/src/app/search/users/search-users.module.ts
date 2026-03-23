import { Module } from '@nestjs/common';
import { SearchUsersController } from './search-users.controller';
import { SearchUsersService } from './search-users.service';

@Module({
  controllers: [SearchUsersController],
  providers: [SearchUsersService],
  exports: [SearchUsersService],
})
export class SearchUsersModule {}
