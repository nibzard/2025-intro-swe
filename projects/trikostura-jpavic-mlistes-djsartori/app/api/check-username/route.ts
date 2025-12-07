import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/lib/rate-limit';

const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'mod', 'support', 'help',
  'system', 'root', 'superuser', 'user', 'guest', 'null', 'undefined',
  'api', 'www', 'forum', 'blog', 'shop', 'store', 'mail', 'email',
  'test', 'demo', 'example', 'sample', 'official', 'staff', 'team'
];

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimiters.api(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { available: false, error: 'Username is required' },
      { status: 400 }
    );
  }

  // Check if username is reserved
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return NextResponse.json({ available: false, reason: 'reserved' });
  }

  // Basic validation
  if (username.length < 3 || username.length > 20) {
    return NextResponse.json({ available: false, reason: 'length' });
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
    return NextResponse.json({ available: false, reason: 'format' });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { available: false, error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ available: !data });
  } catch (error) {
    return NextResponse.json(
      { available: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
