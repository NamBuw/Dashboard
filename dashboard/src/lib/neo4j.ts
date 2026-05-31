import neo4j, { Driver, Session, SessionMode } from "neo4j-driver";

const URI = process.env.NEO4J_URI || "bolt://host.docker.internal:7688";
const USER = process.env.NEO4J_USER || "dashboard_ro";
const PASS = process.env.NEO4J_PASSWORD || "";
const DB = process.env.NEO4J_DATABASE || "neo4j";

declare global {
  // eslint-disable-next-line no-var
  var __neo4jDriver: Driver | undefined;
}

export function getDriver(): Driver {
  if (!globalThis.__neo4jDriver) {
    globalThis.__neo4jDriver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS), {
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 10_000,
      connectionTimeout: 5_000,
      disableLosslessIntegers: true, // KC counts < 2^53, OK to convert
    });
  }
  return globalThis.__neo4jDriver;
}

/** Read-only session — enforce ở driver level vì Community Edition không có RBAC. */
export async function withReadSession<T>(fn: (s: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session({
    defaultAccessMode: neo4j.session.READ as SessionMode,
    database: DB,
  });
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}

export async function pingNeo4j(): Promise<{ ok: boolean; ms: number; error?: string }> {
  const t0 = Date.now();
  try {
    await withReadSession((s) => s.run("RETURN 1 AS ok"));
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, error: (e as Error).message };
  }
}
