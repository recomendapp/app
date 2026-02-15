import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SharedWorkerModule } from '@shared/worker';
import { UsersMovieModule } from './movie/users-movie.module';

@Module({
  imports: [
    SharedWorkerModule,
    UsersMovieModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
