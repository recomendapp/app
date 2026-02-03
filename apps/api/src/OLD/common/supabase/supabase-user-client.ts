import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/type.db.extended';

@Injectable()
export class SupabaseUserClient extends SupabaseClient<Database> {}
