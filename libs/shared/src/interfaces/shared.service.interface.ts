import { MicroserviceOptions } from '@nestjs/microservices';

export interface SharedServiceInterface {
  getGrpcOptions(
    protoName: string,
    servicePackage: string,
  ): MicroserviceOptions;
}
