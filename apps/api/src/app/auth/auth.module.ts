import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard, OptionalAuthGuard } from './guards';
import { AUTH_SERVICE, AuthProvider } from './auth.service';
import { NotifySharedModule } from '@shared/notify';

@Global()
@Module({
  imports: [
    NotifySharedModule
  ],
  controllers: [AuthController],
  providers: [
    AuthProvider,
    AuthGuard,
    OptionalAuthGuard
  ],
  exports: [
    AUTH_SERVICE,
    AuthGuard,
    OptionalAuthGuard
  ],
})
export class AuthModule {}
