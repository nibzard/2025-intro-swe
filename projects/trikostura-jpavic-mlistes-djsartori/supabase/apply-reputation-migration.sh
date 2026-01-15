#!/bin/bash

# Script to apply the reputation system migration
# This script can be run to set up or update the reputation system

echo "🔧 Applying Reputation System Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it using: export DATABASE_URL='your-supabase-connection-string'"
    exit 1
fi

# Apply the migration
psql "$DATABASE_URL" -f "$(dirname "$0")/migrations/reputation_system.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Reputation system migration applied successfully!"
    echo ""
    echo "📊 The system will now:"
    echo "  • Award +5 points for each upvote received"
    echo "  • Deduct -2 points for each downvote received"
    echo "  • Award +15 points when reply is marked as solution"
    echo "  • Award +2 points for creating a topic"
    echo "  • Award +1 point for creating a reply"
    echo ""
    echo "All existing users' reputations have been recalculated!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
