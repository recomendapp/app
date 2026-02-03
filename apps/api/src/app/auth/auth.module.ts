import { Global, Module } from '@nestjs/common';
import { AuthController as AuthControllerV1 } from './auth.controller';
import { AuthGuard, OptionalAuthGuard } from './guards';
import { AUTH_SERVICE, AuthProvider } from './auth.service';
import { MailerSharedModule } from '@shared/mailer';

@Global()
@Module({
  imports: [
    MailerSharedModule
  ],
  controllers: [AuthControllerV1],
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
