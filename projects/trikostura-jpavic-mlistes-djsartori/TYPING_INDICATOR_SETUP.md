# Real-Time Typing Indicator Setup

The typing indicator feature is already implemented in the code but requires Supabase Realtime to be enabled.

## ✅ What's Already Done

- ✅ `typing_indicators` table created in database migration
- ✅ RLS policies configured
- ✅ `TypingIndicator` component implemented
- ✅ Component integrated in topic page
- ✅ `useTypingIndicator` hook for reply form

## 🔧 Setup Required in Supabase

### Step 1: Run the Migration (if not already done)

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/reactions_polls_typing.sql`
3. This creates the `typing_indicators` table

### Step 2: Enable Realtime for typing_indicators Table

**Option A: Via Supabase Dashboard**

1. Go to **Database** → **Replication**
2. Find the `typing_indicators` table
3. Toggle **Enable** next to it
4. Wait a few seconds for replication to start

**Option B: Via SQL**

```sql
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;

-- Enable realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
```

### Step 3: Verify Setup

1. Open two browser windows/tabs
2. Log in as different users in each
3. Go to the same topic
4. Start typing in the reply form in one window
5. You should see "**username** is typing..." in the other window

## 🎯 How It Works

1. When user types in reply form, `useTypingIndicator` hook triggers
2. Inserts/updates record in `typing_indicators` table with current timestamp
3. Supabase Realtime broadcasts the change to all subscribed clients
4. `TypingIndicator` component receives the update and displays it
5. After 3 seconds of inactivity, typing indicator is auto-removed
6. Database cleanup function removes stale indicators (older than 5 seconds)

## 🔍 Troubleshooting

### No typing indicator appears:

1. **Check Realtime is enabled:**
   - Supabase Dashboard → Database → Replication
   - Ensure `typing_indicators` is enabled

2. **Check browser console for errors:**
   - Open DevTools → Console
   - Look for WebSocket or Realtime errors

3. **Verify migration ran:**
   ```sql
   SELECT * FROM typing_indicators LIMIT 1;
   ```
   Should not error (table exists)

4. **Check RLS policies:**
   ```sql
   SELECT * FROM typing_indicators WHERE topic_id = 'some-topic-id';
   ```
   Should return data if someone is typing

### Typing indicator stuck:

- The cleanup function runs automatically
- Manual cleanup:
  ```sql
  DELETE FROM typing_indicators WHERE updated_at < NOW() - INTERVAL '5 seconds';
  ```

## 📊 Performance

- Lightweight: Only broadcasts user_id and timestamp
- Auto-cleanup prevents table bloat
- Indexed for fast queries
- Uses Supabase Realtime's efficient WebSocket connection

## 🚀 Production Deployment

For Vercel:
1. Ensure Supabase Realtime is enabled in production database
2. No additional environment variables needed
3. Realtime works automatically via Supabase client

---

**Note:** The code is production-ready. You just need to enable Realtime in Supabase Dashboard!
