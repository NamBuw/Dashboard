import { Pool } from "pg";

// Dashboard connects directly to PostgreSQL
// Same DB as auth service: ptalk_auth
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "ptalk_auth",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "SecurePassword2024",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export default pool;
