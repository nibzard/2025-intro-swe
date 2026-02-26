import { supabase } from './supabase';
import { PostgrestError, User } from '@supabase/supabase-js';

// **Konstanta za tablicu profila**
const PROFILE_TABLE = 'profiles';

// Funkcija za debug RLS problema (pokušava čitati i pisati)
export async function debugRLSIssue() {
  console.log('🔍 Starting RLS Debug on Profiles table...');
  
  try {
    // 1. Provjeri da li je korisnik autentificiran
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Auth error (1):', userError);
      return { success: false, error: 'Not authenticated', details: userError };
    }
    
    if (!user) {
      console.error('❌ No authenticated user found.');
      return { success: false, error: 'No user found' };
    }
    
    console.log(`✅ User authenticated: ${user.id.substring(0, 8)}... (${user.email})`);
    
    // 2. Pokušaj čitati profil
    console.log('🧪 Attempting to READ profile data...');
    
    const { data: readData, error: readError } = await supabase
      .from(PROFILE_TABLE)
      .select('id, full_name, music_profile')
      .eq('id', user.id)
      .single();

    if (readError && readError.code !== 'PGRST116') { // PGRST116 = Nije pronađeno
      console.error('❌ RLS READ Test failed:', readError);
      return { success: false, error: 'RLS READ failed', code: readError.code, details: readError.message };
    }
    
    console.log('✅ RLS READ Test passed (or profile not yet created).');

    // 3. Pokušaj INSERT/UPDATE (UPSERT) za test
    const testData = {
      id: user.id, // KRITIČNO: ID mora odgovarati auth.uid()
      full_name: readData?.full_name || 'Debug Test User',
      // Ažuriramo samo music_profile kolonu
      music_profile: {
        test_status: 'RLS_DEBUG_OK_' + Date.now(),
        spotify_id: readData?.music_profile?.spotify_id || 'test_spotify_id',
        last_updated: new Date().toISOString(),
      },
    };
    
    console.log('🧪 Attempting to WRITE (UPSERT) profile data...');
    
    const { data: writeData, error: writeError } = await supabase
      .from(PROFILE_TABLE)
      .upsert(testData)
      .select();
    
    if (writeError) {
      console.error('❌ RLS WRITE Test failed:', writeError);
      
      return { 
        success: false, 
        error: 'RLS WRITE failed: ' + writeError.message,
        code: writeError.code,
      };
    }
    
    console.log('✅ RLS WRITE Test passed! Data saved:', writeData);
    return { success: true, message: 'RLS Read/Write OK', data: writeData };
    
  } catch (error: any) {
    console.error('💥 Debug error:', error);
    return { success: false, error: error.message };
  }
}


// Funkcija za automatsko kreiranje profila ako ne postoji
export async function autoFixRLS() {
  console.log('🛠️ Attempting auto-fix for RLS (Profile creation)...');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Cannot fix RLS: No authenticated user');
    return { success: false, error: 'No user' };
  }
  
  // Provjerite postoji li već profil
  const { data: existingProfile } = await supabase
    .from(PROFILE_TABLE)
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    console.log('✅ Profile already exists. No fix needed.');
    return { success: true, method: 'exists' };
  }
  
  console.log('Profile does not exist. Attempting to create basic profile...');
  
  const initialData = {
    id: user.id,
    full_name: user.email?.split('@')[0] || 'New User',
    latitude: 0,
    longitude: 0,
    music_profile: null, // Prazan JSONB
  };
  
  try {
    const { error } = await supabase
      .from(PROFILE_TABLE)
      .insert([initialData]);
    
    if (error) {
      console.error('❌ Profile creation failed:', error);
      return { success: false, error: error.message, code: error.code };
    }
    
    console.log('✅ Basic profile created successfully via simple INSERT.');
    return { success: true, method: 'simple_insert' };
    
  } catch (error: any) {
    console.error('💥 Auto-fix error:', error);
    return { success: false, error: error.message };
  }
}