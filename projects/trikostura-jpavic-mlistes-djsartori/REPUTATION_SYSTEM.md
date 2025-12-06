# Reputation System Documentation

## Overview

The forum implements a comprehensive reputation system that automatically rewards users for positive contributions and quality content. User reputation is calculated and updated in real-time based on various activities.

## Point System

| Action | Points | Description |
|--------|--------|-------------|
| **Receive Upvote** | +5 | When someone upvotes your reply |
| **Receive Downvote** | -2 | When someone downvotes your reply |
| **Solution Accepted** | +15 | When your reply is marked as the solution |
| **Solution Removed** | -15 | When your reply is unmarked as solution |
| **Create Topic** | +2 | For posting a new topic |
| **Create Reply** | +1 | For posting a reply |
| **Delete Topic** | -2 | When your topic is deleted |
| **Delete Reply** | -1 | When your reply is deleted |

## How It Works

### Automatic Updates

The reputation system uses PostgreSQL triggers that automatically update user reputation when:

1. **Votes are cast** - When users upvote or downvote replies
2. **Votes are changed** - When users change their vote from up to down or vice versa
3. **Votes are removed** - When users remove their votes
4. **Solutions are marked** - When topic authors mark a reply as the solution
5. **Content is created** - When users create topics or replies
6. **Content is deleted** - When topics or replies are removed

### Self-Vote Prevention

Users cannot gain reputation from voting on their own replies. The system automatically ignores self-votes for reputation calculation.

## Database Functions

### `recalculate_user_reputation(user_id UUID)`

Recalculates the total reputation for a specific user based on all their activity.

```sql
SELECT recalculate_user_reputation('user-uuid-here');
```

### `recalculate_all_reputations()`

Recalculates reputation for all users in the system. Useful for backfilling or fixing discrepancies.

```sql
SELECT * FROM recalculate_all_reputations();
```

## Reputation Breakdown View

A database view `user_reputation_breakdown` provides detailed reputation analytics:

```sql
SELECT * FROM user_reputation_breakdown WHERE username = 'someuser';
```

Returns:
- Current reputation
- Topic count
- Reply count
- Upvotes received
- Downvotes received
- Solutions count
- Calculated reputation (for verification)

## Display Locations

User reputation is displayed in:

1. **User Profile Page** - Shows total reputation with a star icon
2. **Users Listing Page** - Users sorted by reputation (highest first)
3. **User Search Results** - Reputation shown alongside user info
4. **Leaderboards** - Top users by reputation

## Migration

The reputation system was implemented via the `reputation_system.sql` migration file.

### Applying the Migration

If running this project from scratch or updating an existing database:

```bash
# Set your database connection string
export DATABASE_URL='your-supabase-connection-string'

# Run the migration script
./supabase/apply-reputation-migration.sh
```

Or manually:

```bash
psql "$DATABASE_URL" -f supabase/migrations/reputation_system.sql
```

### Backfilling Existing Data

The migration automatically backfills reputation for all existing users when first applied. If you need to recalculate:

```sql
SELECT recalculate_all_reputations();
```

## Technical Implementation

### Triggers

1. **`reputation_on_vote_trigger`** - Fires on votes table INSERT/UPDATE/DELETE
2. **`reputation_on_solution_trigger`** - Fires when reply.is_solution changes
3. **`reputation_on_topic_trigger`** - Fires on topics table INSERT/DELETE
4. **`reputation_on_reply_trigger`** - Fires on replies table INSERT/DELETE

### Functions

- `update_reputation_on_vote()` - Handles vote-based reputation changes
- `update_reputation_on_solution()` - Handles solution-based reputation changes
- `update_reputation_on_topic()` - Handles topic creation/deletion
- `update_reputation_on_reply()` - Handles reply creation/deletion

All functions are marked `SECURITY DEFINER` to ensure they run with the necessary permissions.

## Examples

### User creates a topic and receives upvotes

1. User creates topic → **+2 points**
2. User replies to topic → **+1 point**
3. Reply gets 3 upvotes → **+15 points** (3 × 5)
4. Reply marked as solution → **+15 points**
5. **Total: +33 points**

### User receives mixed feedback

1. User creates 5 replies → **+5 points** (5 × 1)
2. Receives 10 upvotes → **+50 points** (10 × 5)
3. Receives 2 downvotes → **-4 points** (2 × -2)
4. One reply marked as solution → **+15 points**
5. **Total: +66 points**

## Monitoring

To monitor reputation changes:

```sql
-- View all users with reputation breakdown
SELECT * FROM user_reputation_breakdown
ORDER BY reputation DESC
LIMIT 20;

-- Check specific user's reputation details
SELECT
  username,
  reputation,
  topic_count,
  reply_count,
  upvotes_received,
  downvotes_received,
  solutions_count
FROM user_reputation_breakdown
WHERE username = 'someuser';
```

## Future Enhancements

Potential improvements to consider:

- **Badges/Achievements** - Award badges for reputation milestones
- **Reputation Decay** - Reduce points for very old content
- **Quality Thresholds** - Unlock features at certain reputation levels
- **Daily Limits** - Cap daily reputation gains to prevent gaming
- **Topic Upvotes** - Award points for topic upvotes (not just replies)
- **Penalty System** - Deduct points for spam or rule violations
- **Reputation History** - Track reputation changes over time

## Troubleshooting

### Reputation seems incorrect

Recalculate the user's reputation:

```sql
SELECT recalculate_user_reputation('user-uuid-here');
```

### Global reputation reset needed

Recalculate all users:

```sql
SELECT recalculate_all_reputations();
```

### Check if triggers are working

```sql
-- List all triggers on votes table
SELECT * FROM pg_trigger WHERE tgname LIKE '%reputation%';
```

## Security

- All reputation update functions use `SECURITY DEFINER` to ensure proper execution
- Users cannot directly modify their own reputation
- Self-votes are automatically excluded from reputation calculation
- All changes are audit-logged through PostgreSQL triggers
