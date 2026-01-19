# Apply Database Migrations for New Features

# 🎯 **EMOJI REACTIONS**
# 🗳️ **TOPIC POLLS**  
# ⌨️ **TYPING INDICATORS**

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Applying Forum Enhancement Migrations" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# Configuration
$SUPABASE_PROJECT_REF = "iqvopnlupmqyeorqpgnj"
$DB_PASSWORD = "nJQdnrRMnqVrLVnvr"  # Replace with your actual password
$DB_HOST = "db.$SUPABASE_PROJECT_REF.supabase.co"
$DB_PORT = "5432"
$DB_NAME = "postgres"

$MIGRATION_FILE = "supabase\migrations\reactions_polls_typing.sql"

Write-Host "📋 Migration Details:" -ForegroundColor Yellow
Write-Host "  • Database: $DB_HOST" -ForegroundColor Gray
Write-Host "  • Migration: $MIGRATION_FILE`n" -ForegroundColor Gray

# Check if migration file exists
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Error: Migration file not found!" -ForegroundColor Red
    Write-Host "  Expected: $MIGRATION_FILE" -ForegroundColor Gray
    exit 1
}

# Display what will be created
Write-Host "🔧 This migration will create:" -ForegroundColor Green
Write-Host "  1. Emoji Reactions System" -ForegroundColor White
Write-Host "     ├─ reactions table" -ForegroundColor Gray
Write-Host "     ├─ RLS policies" -ForegroundColor Gray
Write-Host "     └─ Helper functions" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Topic Polls System" -ForegroundColor White
Write-Host "     ├─ polls table" -ForegroundColor Gray
Write-Host "     ├─ poll_options table" -ForegroundColor Gray
Write-Host "     ├─ poll_votes table" -ForegroundColor Gray
Write-Host "     ├─ RLS policies" -ForegroundColor Gray
Write-Host "     └─ Helper functions" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Typing Indicators System" -ForegroundColor White
Write-Host "     ├─ typing_indicators table" -ForegroundColor Gray
Write-Host "     ├─ RLS policies" -ForegroundColor Gray
Write-Host "     └─ Cleanup functions`n" -ForegroundColor Gray

# Confirm before proceeding
$confirmation = Read-Host "Do you want to apply these migrations? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "`n❌ Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n🚀 Applying migrations..." -ForegroundColor Cyan

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Apply migration using psql
try {
    $result = psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -f $MIGRATION_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host "`n📊 Created:" -ForegroundColor Cyan
        Write-Host "  • 3 new tables (reactions, polls + 2 more, typing_indicators)" -ForegroundColor White
        Write-Host "  • 12 indexes for fast queries" -ForegroundColor White
        Write-Host "  • 15 RLS policies for security" -ForegroundColor White
        Write-Host "  • 5 helper functions" -ForegroundColor White
        Write-Host "`n🎉 Your forum now supports:" -ForegroundColor Green
        Write-Host "  👍 Emoji reactions (6 emojis)" -ForegroundColor White
        Write-Host "  🗳️  Topic polls with voting" -ForegroundColor White
        Write-Host "  ⌨️  Real-time typing indicators" -ForegroundColor White
    } else {
        Write-Host "`n❌ Migration failed!" -ForegroundColor Red
        Write-Host "Error details:" -ForegroundColor Gray
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Error running migration!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  1. Start your dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Visit a topic page to see reactions" -ForegroundColor White
Write-Host "  3. Create a new topic with a poll" -ForegroundColor White
Write-Host "  4. Watch typing indicators in real-time!" -ForegroundColor White
Write-Host "`n✨ Enjoy your enhanced forum!" -ForegroundColor Green
