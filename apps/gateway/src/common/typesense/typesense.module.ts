import { Module } from '@nestjs/common';
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
              host: process.env.TYPESENSE_HOST!,
              port: parseInt(process.env.TYPESENSE_PORT!, 10),
              protocol: process.env.TYPESENSE_PROTOCOL as 'http' | 'https',
            },
          ],
          apiKey: process.env.TYPESENSE_API_KEY!,
          connectionTimeoutSeconds: 2,
        });
      },
    },
  ],
  exports: [TYPESENSE_CLIENT],
})
export class TypesenseModule {}
