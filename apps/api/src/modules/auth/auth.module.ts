import { Global, Module } from '@nestjs/common';
import {
  AuthGuard,
  OptionalAuthGuard,
  SharedModule,
  AUTH_SERVICE_NAME,
  AUTH_PACKAGE_NAME,
} from '@app/shared';

@Global()
@Module({
  imports: [
    SharedModule.registerGrpcClient(
      AUTH_SERVICE_NAME,
      AUTH_PACKAGE_NAME,
      'auth',
    ),
  ],
  providers: [AuthGuard, OptionalAuthGuard],
  exports: [AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
