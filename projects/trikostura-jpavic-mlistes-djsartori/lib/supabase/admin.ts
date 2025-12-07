import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Create Supabase admin client with service role
// ONLY use this for admin operations that require elevated privileges
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
