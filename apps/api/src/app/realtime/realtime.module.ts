import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

// Global so any feature module (playlists, and future features) can inject RealtimeGateway
// without importing this module explicitly — mirrors AuthModule's pattern.
@Global()
@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
