import { createClient } from '@supabase/supabase-js';
import { getPublicEnv } from './config';

const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

/**
 * Browser-safe client using the anon key only.
 * Table access is denied by RLS; all writes go through SECURITY DEFINER RPCs.
 */
export const supabase = createClient(supabaseUrl || 'https://invalid.supabase.co', supabaseAnonKey || 'invalid', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
