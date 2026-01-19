// Diagnostic script to check bookmarks functionality
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

async function checkBookmarks() {
  console.log('🔍 Checking bookmarks functionality...\n');

  // Check if bookmarks table exists
  console.log('1️⃣ Checking bookmarks table...');
  const { data: bookmarksData, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('*')
    .limit(1);

  if (bookmarksError) {
    console.error('❌ Error querying bookmarks table:');
    console.error(bookmarksError.message);
    console.error('\n💡 The bookmarks table may not exist. Please run: supabase/migrations/high_priority_features.sql');
    return;
  }

  console.log('✅ Bookmarks table exists!');
  console.log('   Sample data:', JSON.stringify(bookmarksData, null, 2));

  // Check if topics table has has_solution column
  console.log('\n2️⃣ Checking topics table for has_solution column...');
  const { data: topicsData, error: topicsError } = await supabase
    .from('topics')
    .select('id, title, has_solution')
    .limit(1);

  if (topicsError) {
    console.error('❌ Error querying topics table with has_solution:');
    console.error(topicsError.message);
    console.error('\n💡 The has_solution column may not exist. Please run: supabase/migrations/high_priority_features.sql');
    return;
  }

  console.log('✅ Topics table has has_solution column!');
  console.log('   Sample data:', JSON.stringify(topicsData, null, 2));

  // Try the full bookmarks query like in the page
  console.log('\n3️⃣ Testing full bookmarks query...');
  const { data: fullQuery, error: fullQueryError } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      topic:topics(
        id,
        title,
        slug,
        created_at,
        reply_count,
        view_count,
        has_solution,
        author:profiles!topics_author_id_fkey(username, avatar_url),
        category:categories(name, slug, color)
      )
    `)
    .limit(5);

  if (fullQueryError) {
    console.error('❌ Error with full bookmarks query:');
    console.error(fullQueryError.message);
    console.error(JSON.stringify(fullQueryError, null, 2));
    return;
  }

  console.log('✅ Full bookmarks query successful!');
  console.log('   Found', fullQuery?.length || 0, 'bookmarks');
  console.log('   Sample:', JSON.stringify(fullQuery?.[0], null, 2));

  console.log('\n✨ Diagnostic check complete!');
}

checkBookmarks().catch(console.error);
