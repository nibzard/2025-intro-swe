import { createClient } from '@supabase/supabase-js';

// Koristimo Expo environment varijable
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔧 Supabase Initialization:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey?.substring(0, 20) + '...');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Test funkcija
export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    // Test 1: Provjeri da li možemo dohvatiti users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users test failed:', usersError);
      return { success: false, error: usersError };
    }
    
    console.log('✅ Users test passed:', users?.length || 0, 'users found');
    
    // Test 2: Provjeri da li možemo dohvatiti music_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('music_profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Music profiles test failed:', profilesError);
      return { success: false, error: profilesError };
    }
    
    console.log('✅ Music profiles test passed');
    
    return { 
      success: true, 
      message: 'Supabase connection successful',
      usersCount: users?.length || 0
    };
    
  } catch (error: any) {
    console.error('💥 Connection test error:', error);
    return { success: false, error: error.message };
  }
}