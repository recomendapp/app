import { Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { FastifyRequest } from 'fastify';
import { TypedSupabaseClient } from './typed-supabase-client';
import { Database } from 'src/types/type.db.extended';

@Module({
  providers: [
    {
      provide: TypedSupabaseClient,
      scope: Scope.REQUEST,
      useFactory: (req: FastifyRequest): TypedSupabaseClient => {
        const rawToken = req.headers.authorization?.replace('Bearer ', '');
        const accessToken =
          rawToken && rawToken.split('.').length === 3 ? rawToken : null;

        const language = (req.headers['language'] as string) || 'en-US';

        const headers = {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          language,
        };
        const client = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_ANON_KEY!,
          {
            global: { headers },
            auth: {
              persistSession: false,
            },
          },
        );
        return client;
      },
      inject: [REQUEST],
    },
  ],
  exports: [TypedSupabaseClient],
})
export class SupabaseModule {}
