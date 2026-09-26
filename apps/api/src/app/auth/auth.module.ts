import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard, OptionalAuthGuard, McpBearerAuthGuard } from './guards';
import { AUTH_SERVICE, AuthProvider } from './auth.service';
import { NotifySharedModule } from '@shared/notify';
import { SharedWorkerModule } from '@shared/worker';
import { SessionCleanupService } from './session-cleanup.service';

@Global()
@Module({
  imports: [NotifySharedModule, SharedWorkerModule],
  controllers: [AuthController],
  providers: [
    AuthProvider,
    AuthGuard,
    OptionalAuthGuard,
    McpBearerAuthGuard,
    SessionCleanupService,
  ],
  exports: [AUTH_SERVICE, AuthGuard, OptionalAuthGuard, McpBearerAuthGuard],
})
export class AuthModule {}
