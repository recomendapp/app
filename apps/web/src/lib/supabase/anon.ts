import { Database } from '@recomendapp/types';
import { createClient as createClientSupabase } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../env';
import { cache } from 'react';

export const createAnonClient = cache((locale: string = 'default') => {
    const newClient = createClientSupabase<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false, 
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
            global: {
                headers: {
                    'language': locale,
                }
            }
        }
    );

    return newClient;
});