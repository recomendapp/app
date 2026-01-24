import { Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { FastifyRequest } from 'fastify';
import { Database } from 'apps/gateway/src/types/type.db.extended';
import { SupabaseAdminClient } from './supabase-admin-client';
import { SupabaseUserClient } from './supabase-user-client';

@Module({
  providers: [
    {
      provide: SupabaseUserClient,
      scope: Scope.REQUEST,
      useFactory: (req: FastifyRequest) => {
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
    {
      provide: SupabaseAdminClient,
      useFactory: () => {
        const client = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              persistSession: false,
            },
          },
        );
        return client;
      },
    },
  ],
  exports: [SupabaseUserClient, SupabaseAdminClient],
})
export class SupabaseModule {}
