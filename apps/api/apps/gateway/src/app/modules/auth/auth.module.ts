import { Global, Module } from '@nestjs/common';
import { AuthGuard, OptionalAuthGuard } from '@api/auth-tools';
import { AUTH_SERVICE_NAME, AUTH_PACKAGE_NAME } from '@api/protos';
import { GrpcTransportModule } from '@api/transport';
import { env } from '../../../env';

@Global()
@Module({
  imports: [
    GrpcTransportModule.register({
      serviceName: AUTH_SERVICE_NAME,
      packageName: AUTH_PACKAGE_NAME,
      protoDomain: 'auth',
      protoFile: 'auth.proto',
      url: env.AUTH_GRPC_URL,
    }),
  ],
  providers: [AuthGuard, OptionalAuthGuard],
  exports: [AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
