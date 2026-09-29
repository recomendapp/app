import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { AppVersionMiddleware } from './app-version.middleware';

@Module({
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppVersionMiddleware)
      // The app must always be able to learn its own status, even once outdated.
      .exclude({ path: 'status', method: RequestMethod.GET, version: '1' })
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
