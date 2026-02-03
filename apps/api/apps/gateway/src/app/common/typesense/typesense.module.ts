import { Module } from '@nestjs/common';
import { env } from '../../../env';
import { Client } from 'typesense';

export const TYPESENSE_CLIENT = 'TYPESENSE_CLIENT';

@Module({
  providers: [
    {
      provide: TYPESENSE_CLIENT,
      useFactory: () => {
        return new Client({
          nodes: [
            {
              host: env.TYPESENSE_HOST,
              port: env.TYPESENSE_PORT,
              protocol: env.TYPESENSE_PROTOCOL,
            },
          ],
          apiKey: env.TYPESENSE_API_KEY,
          connectionTimeoutSeconds: 2,
        });
      },
    },
  ],
  exports: [TYPESENSE_CLIENT],
})
export class TypesenseModule {}
