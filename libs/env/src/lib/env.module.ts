import { Global, Module } from '@nestjs/common';
import { apiSchema, validateEnv } from './env.validation'
import z from 'zod';

export const ENV_SERVICE = Symbol('ENV_SERVICE');

export type EnvService = z.infer<typeof apiSchema>;

@Global()
@Module({
  providers: [
    {
      provide: ENV_SERVICE,
      useFactory: () => {
        return validateEnv(apiSchema);
      },
    },
  ],
  exports: [ENV_SERVICE],
})
export class EnvModule {}