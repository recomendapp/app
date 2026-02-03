import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getProtoPath } from './proto-path.util';

interface GrpcServerConfig {
  packageName: string; // ex: 'auth'
  protoDomain: string; // ex: 'auth'
  protoFile: string; // ex: 'auth.proto'
  url: string; // ex: '0.0.0.0:50051'
}

export function createGrpcOptions(
  config: GrpcServerConfig,
): MicroserviceOptions {
  return {
    transport: Transport.GRPC,
    options: {
      package: config.packageName,
      url: config.url,
      protoPath: getProtoPath(config.protoDomain, config.protoFile),

      loader: {
        keepCase: true, // Preserve camelCase vs snake_case
        longs: String, // Handle int64 as strings (avoid precision loss)
        enums: String, // Handle enums as names (not index)
        defaults: true,
        oneofs: true,
      },
    },
  };
}
