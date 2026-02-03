import { cookies } from 'next/headers';
import {
  createServerClient as createServerClientSupabase,
} from '@supabase/ssr';
import { Database } from '@recomendapp/types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../env';
import { cache } from 'react';
import { SupportedLocale } from '@/translations/locales';
import { NextRequest } from 'next/server';
import { routing } from '../i18n/routing';

type CreateClientOptions = {
  cookieStore?: NextRequest['cookies']
  locale?: SupportedLocale
}

export const createServerClient = cache(async (options?: CreateClientOptions) => {
  const cookieStore = options?.cookieStore ?? await cookies();
  const locale = options?.locale ?? routing.defaultLocale // await getLocale();
  const client = createServerClientSupabase<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: {
          'language': locale,
        }
      }
    },
  );

  (client.auth as any).suppressGetSessionWarning = true;

  return client;
});