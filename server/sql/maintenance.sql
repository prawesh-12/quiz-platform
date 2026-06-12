-- PostgreSQL diagnostics & maintenance. Run via: psql "$DATABASE_URL" -f server/sql/maintenance.sql
-- (or `npm run db:maintenance` for the read-only snapshot + ANALYZE).

-- Enable slow-query logging once (superuser; pg_stat_statements needs a restart):
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET log_min_duration_statement = '500ms';
-- ALTER SYSTEM SET log_lock_waits = on;
-- SELECT pg_reload_conf();
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slowest statements by cumulative time.
SELECT
  query,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2)  AS mean_ms,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS cache_hit_pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Unused indexes (confirm over a full quiz cycle before dropping).
SELECT
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Seq vs index scans per table (high seq_scan on a hot table = missing index).
SELECT relname AS table_name, seq_scan, idx_scan, n_live_tup AS live_rows
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Dead-tuple bloat and last (auto)vacuum/analyze.
SELECT
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Connections by state (compare against PG_POOL_MAX * api_instances).
SELECT count(*) AS connections, state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connections DESC;

-- Queries running longer than 5s.
SELECT pid, now() - query_start AS running_for, state, wait_event_type, left(query, 120) AS query
FROM pg_stat_activity
WHERE state <> 'idle' AND query_start < now() - interval '5 seconds'
ORDER BY query_start ASC;

-- Table + index sizes.
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS indexes_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- Routine maintenance. ANALYZE is cheap; VACUUM reclaims space without blocking reads/writes.
ANALYZE student_answers;
ANALYZE student_sessions;
ANALYZE violation_flags;
-- VACUUM (ANALYZE) student_answers;
-- VACUUM (ANALYZE) student_sessions;
