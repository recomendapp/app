import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getProtoPath } from './proto-path.util';

type GrpcTransportOptions = {
  serviceName: string; // Injection token (ex: AUTH_SERVICE)
  packageName: string; // Protobuf package (ex: 'auth')
  protoDomain: string; // Folder in libs/protos (ex: 'auth')
  protoFile: string; // Proto file name (ex: 'auth.proto')
} & ({ urlEnvKey: string } | { url: string });

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
  ],
})
export class GrpcTransportModule {
  static register(options: GrpcTransportOptions): DynamicModule {
    return {
      module: GrpcTransportModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: options.serviceName,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const url =
                'url' in options
                  ? options.url
                  : config.get<string>(options.urlEnvKey);

              if (!url) {
                throw new Error(
                  `[GrpcTransport] Env variable '${'url' in options ? 'url' : options.urlEnvKey}' is missing.`,
                );
              }

              return {
                transport: Transport.GRPC,
                options: {
                  package: options.packageName,
                  protoPath: getProtoPath(
                    options.protoDomain,
                    options.protoFile,
                  ),
                  url: url,
                },
              };
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
