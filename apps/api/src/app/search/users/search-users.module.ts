import { Module } from '@nestjs/common';
import { SearchUsersController } from './search-users.controller';
import { SearchUsersService } from './search-users.service';
import { SearchUsersTool } from './search-users.tool';

@Module({
  controllers: [SearchUsersController, SearchUsersTool],
  providers: [SearchUsersService],
  exports: [SearchUsersService],
})
export class SearchUsersModule {}
