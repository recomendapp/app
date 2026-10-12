import { type DynamicModule, Global, Module } from '@nestjs/common';
import { apiSchema, validateEnv, workerSchema } from './env.validation';
import z from 'zod';

export const ENV_SERVICE = Symbol('ENV_SERVICE');

export type EnvService = z.infer<typeof apiSchema>;

// `ENV_SERVICE` resolves to whichever schema the app passed to `forRoot`, and the keys
// below only exist on the worker's -- inject this instead of `EnvService` to reach them.
export type WorkerEnvService = z.infer<typeof workerSchema>;

@Global()
@Module({})
export class EnvModule {
  static forRoot(schema: z.ZodType): DynamicModule {
    return {
      module: EnvModule,
      providers: [
        {
          provide: ENV_SERVICE,
          useFactory: () => {
            return validateEnv(schema);
          },
        },
      ],
      exports: [ENV_SERVICE],
    };
  }
}
