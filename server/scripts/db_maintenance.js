import "dotenv/config";

import pool from "../config/db.js";

// DB health snapshot + ANALYZE on the hot tables. Pass --no-analyze for report only.
// Full query catalogue: server/sql/maintenance.sql.

const HOT_TABLES = ["student_answers", "student_sessions", "violation_flags"];

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function printRows(rows) {
  if (!rows.length) {
    console.log("(none)");
    return;
  }
  console.table(rows);
}

async function safeQuery(label, text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.warn(`Skipped "${label}": ${error.message}`);
    return null;
  }
}

async function reportConnections() {
  printSection("Connections by state");
  const rows = await safeQuery(
    "connections",
    `SELECT count(*)::int AS connections, state
     FROM pg_stat_activity
     WHERE datname = current_database()
     GROUP BY state
     ORDER BY connections DESC`
  );
  if (rows) printRows(rows);
}

async function reportUnusedIndexes() {
  printSection("Unused indexes (idx_scan = 0)");
  const rows = await safeQuery(
    "unused indexes",
    `SELECT relname AS table_name,
            indexrelname AS index_name,
            idx_scan,
            pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
     FROM pg_stat_user_indexes
     WHERE idx_scan = 0
     ORDER BY pg_relation_size(indexrelid) DESC`
  );
  if (rows) printRows(rows);
}

async function reportTableActivity() {
  printSection("Write-heavy table activity (dead tuples / last vacuum)");
  const rows = await safeQuery(
    "table activity",
    `SELECT relname AS table_name,
            n_live_tup AS live_rows,
            n_dead_tup AS dead_rows,
            round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
            last_autovacuum,
            last_autoanalyze
     FROM pg_stat_user_tables
     WHERE relname = ANY($1)
     ORDER BY n_dead_tup DESC`,
    [HOT_TABLES]
  );
  if (rows) printRows(rows);
}

async function reportSlowQueries() {
  printSection("Top slow statements (pg_stat_statements)");
  const rows = await safeQuery(
    "slow queries",
    `SELECT left(query, 80) AS query,
            calls,
            round(total_exec_time::numeric, 2) AS total_ms,
            round(mean_exec_time::numeric, 2) AS mean_ms
     FROM pg_stat_statements
     ORDER BY total_exec_time DESC
     LIMIT 10`
  );
  if (rows === null) {
    console.log("pg_stat_statements not enabled — see server/sql/maintenance.sql.");
  } else {
    printRows(rows);
  }
}

async function runAnalyze() {
  printSection("ANALYZE (refresh planner statistics)");
  for (const table of HOT_TABLES) {
    const rows = await safeQuery(`analyze ${table}`, `ANALYZE ${table};`);
    if (rows !== null) {
      console.log(`ANALYZE ${table} — done`);
    }
  }
}

async function main() {
  const skipAnalyze = process.argv.slice(2).includes("--no-analyze");

  console.log(`PostgreSQL maintenance report — ${new Date().toISOString()}`);

  await reportConnections();
  await reportUnusedIndexes();
  await reportTableActivity();
  await reportSlowQueries();

  if (!skipAnalyze) {
    await runAnalyze();
  }
}

main()
  .catch((error) => {
    console.error("Maintenance run failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
