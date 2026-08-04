import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const effectiveKey =
      env.SUPABASE_SECRET_KEY && !env.SUPABASE_SECRET_KEY.includes('•')
        ? env.SUPABASE_SECRET_KEY
        : env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.startsWith('mock')
        ? env.SUPABASE_SERVICE_ROLE_KEY
        : env.SUPABASE_PUBLISHABLE_KEY && !env.SUPABASE_PUBLISHABLE_KEY.startsWith('mock')
        ? env.SUPABASE_PUBLISHABLE_KEY
        : env.SUPABASE_ANON_KEY && !env.SUPABASE_ANON_KEY.startsWith('mock')
        ? env.SUPABASE_ANON_KEY
        : env.SUPABASE_SERVICE_ROLE_KEY;

    supabaseClient = createClient(env.SUPABASE_URL, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}
