/**
 * Check if achievements system is properly set up
 * Run: node scripts/check-achievements-setup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSetup() {
  console.log('🔍 Checking achievements system setup...\n');

  // Check user_achievements table
  console.log('1. Checking user_achievements table...');
  const { data: achievements, error: achError } = await supabase
    .from('user_achievements')
    .select('*')
    .limit(1);

  if (achError) {
    console.error('❌ user_achievements table error:', achError.message);
    console.log('   💡 Run: supabase/migrations/achievements_system.sql\n');
  } else {
    console.log('✅ user_achievements table exists\n');
  }

  // Check user_activity table
  console.log('2. Checking user_activity table...');
  const { data: activity, error: actError } = await supabase
    .from('user_activity')
    .select('*')
    .limit(1);

  if (actError) {
    console.error('❌ user_activity table error:', actError.message);
    console.log('   💡 Run: supabase/migrations/achievements_system.sql\n');
  } else {
    console.log('✅ user_activity table exists\n');
  }

  // Check if any achievements are awarded
  console.log('3. Checking awarded achievements...');
  const { data: allAchievements, error: allError } = await supabase
    .from('user_achievements')
    .select('*');

  if (!allError) {
    console.log(`✅ Total achievements awarded: ${allAchievements?.length || 0}\n`);
  }

  // Check profiles table for user data
  console.log('4. Checking user profiles...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, created_at, reputation')
    .limit(5);

  if (profileError) {
    console.error('❌ profiles table error:', profileError.message);
  } else {
    console.log(`✅ Found ${profiles?.length || 0} users`);
    if (profiles && profiles.length > 0) {
      console.log('\n   Sample users:');
      profiles.forEach(p => {
        console.log(`   - ${p.username} (created: ${p.created_at?.substring(0, 10)}, reputation: ${p.reputation || 0})`);
      });
    }
    console.log('');
  }

  // Summary
  console.log('\n📊 Summary:');
  const tablesExist = !achError && !actError;
  if (tablesExist) {
    console.log('✅ All achievement tables exist');
    console.log('✅ System is ready to award achievements');
    console.log('\n💡 Visit a user profile to trigger achievement checks');
  } else {
    console.log('❌ Missing tables - run migrations first');
    console.log('\n📝 To fix:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run: supabase/migrations/achievements_system.sql');
    console.log('3. Refresh this page and try again');
  }
}

checkSetup().catch(console.error);
