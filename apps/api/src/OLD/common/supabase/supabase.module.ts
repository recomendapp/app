import { Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { FastifyRequest } from 'fastify';
import { SupabaseAdminClient } from './supabase-admin-client';
import { SupabaseUserClient } from './supabase-user-client';
import { Database } from '../../types/type.db.extended';

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
          '',
          '',
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
          '',
          '',
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
