-- Database Performance Optimization
-- Run this to enable query performance tracking and optimizations

-- Enable pg_stat_statements extension for query performance tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create materialized view for category stats (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS category_stats AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.color,
    c.icon,
    c.description,
    COUNT(DISTINCT t.id) as topic_count,
    COUNT(DISTINCT r.id) as reply_count,
    MAX(t.created_at) as last_activity
FROM categories c
LEFT JOIN topics t ON t.category_id = c.id
LEFT JOIN replies r ON r.topic_id = t.id
GROUP BY c.id, c.name, c.slug, c.color, c.icon, c.description;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_stats_id ON category_stats(id);

-- Function to refresh category stats
CREATE OR REPLACE FUNCTION refresh_category_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_stats;
END;
$$ LANGUAGE plpgsql;

-- Set up connection pooling recommendations
COMMENT ON DATABASE postgres IS 'Recommended connection pool: min=2, max=10 for production';

-- Note: VACUUM ANALYZE cannot run in Supabase SQL Editor (transaction block limitation)
-- PostgreSQL's autovacuum will handle this automatically
-- To run manually, use: psql -c "VACUUM ANALYZE;" (outside transaction)

-- View slow queries (useful for debugging)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    query
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Grant access to slow queries view
GRANT SELECT ON slow_queries TO authenticated;
