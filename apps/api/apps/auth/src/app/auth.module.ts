import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { GrpcTransportModule } from '@api/transport';
import { env } from '../env';

@Module({
  imports: [
    GrpcTransportModule,
    JwtModule.register({
      secret: env.SUPABASE_JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
