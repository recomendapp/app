import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { SharedService } from '../services/shared.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
  ],
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {
  static registerGrpcClient(
    serviceName: string,
    servicePackage: string,
    protoName: string,
  ): DynamicModule {
    const providers = [
      {
        provide: serviceName,
        useFactory: (configService: ConfigService) => {
          const url = configService.get<string>('AUTH_GRPC_URL');
          const protoPath = join(
            process.cwd(),
            `libs/shared/src/protos/${protoName}.proto`,
          );

          return ClientProxyFactory.create({
            transport: Transport.GRPC,
            options: {
              package: servicePackage,
              protoPath,
              url: url || '0.0.0.0:50051',
            },
          });
        },
        inject: [ConfigService],
      },
    ];
    return {
      module: SharedModule,
      imports: [ConfigModule],
      providers,
      exports: providers,
    };
  }
}
