import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: true }
});
try {
  const tables = await pool.query(`
    SELECT count(*)::int AS total,
           array_agg(table_name ORDER BY table_name) AS tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name LIKE 'hireuo_%'
  `);
  const migrations = await pool.query(`
    SELECT count(*)::int AS total
    FROM drizzle.__drizzle_migrations
  `);
  console.log("HIREUO TABLES:", JSON.stringify(tables.rows[0], null, 2));
  console.log("APPLIED MIGRATIONS:", migrations.rows[0].total);
} finally {
  await pool.end();
}
