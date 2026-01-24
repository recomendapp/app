import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { SharedServiceInterface } from '../interfaces/shared.service.interface';

@Injectable()
export class SharedService implements SharedServiceInterface {
  constructor(private readonly configService: ConfigService) {}

  getGrpcOptions(
    protoName: string,
    servicePackage: string,
  ): MicroserviceOptions {
    const url = this.configService.get<string>('AUTH_GRPC_URL');

    return {
      transport: Transport.GRPC,
      options: {
        package: servicePackage,
        protoPath: join(
          process.cwd(),
          `libs/shared/src/protos/${protoName}.proto`,
        ),
        url: url || '0.0.0.0:50051',
      },
    };
  }
}
