// Quick diagnostic script to check database schema
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking database schema...\n');

  // Try to query a profile with the new fields
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url, profile_banner_url, profile_color, github_url, linkedin_url, year_of_study, skills')
    .limit(1);

  if (error) {
    console.error('❌ Error querying profiles table:');
    console.error(error.message);
    console.error('\n💡 This likely means the database migration has NOT been run yet.');
    console.error('   Please run the SQL in: supabase/advanced-profile-fields.sql');
    return;
  }

  console.log('✅ Successfully queried profiles table with new fields!');
  console.log('📊 Sample data:', JSON.stringify(data, null, 2));

  // Check storage bucket
  console.log('\n🗄️ Checking storage bucket...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error('❌ Error listing storage buckets:', bucketError.message);
    return;
  }

  const profileImagesBucket = buckets.find(b => b.name === 'profile-images');
  if (profileImagesBucket) {
    console.log('✅ Storage bucket "profile-images" exists!');
    console.log('   Public:', profileImagesBucket.public);
  } else {
    console.log('❌ Storage bucket "profile-images" NOT FOUND!');
    console.log('   Please create it in Supabase Dashboard → Storage');
    console.log('   Available buckets:', buckets.map(b => b.name).join(', '));
  }

  console.log('\n✨ Diagnostic check complete!');
}

checkDatabase().catch(console.error);
