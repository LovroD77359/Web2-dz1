// DB config and interaction

import pg from "pg";

export type PassStatus = "ACTIVE" | "CANCELLED";

export type Pass = {
  id: string;
  name: string;
  document: string;
  issuedAt: string;
  status: PassStatus;
};

type PassRow = {
  id: string;
  name: string;
  document: string;
  issued_at: Date;
  status: PassStatus;
};

function toPass(row: PassRow): Pass {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    issuedAt: row.issued_at.toISOString().replace(/\.\d{3}Z$/, "Z"),
    status: row.status,
  };
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

let schemaReady: Promise<unknown> | undefined;
async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  schemaReady ??= pool.query(`CREATE TABLE IF NOT EXISTS passes (
           id        uuid        PRIMARY KEY,
           name      text        NOT NULL,
           document  text        NOT NULL,
           issued_at timestamptz NOT NULL DEFAULT now(),
           status    text        NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'CANCELLED'))
         )`);
  await schemaReady;
  return pool.query<T>(text, params);
}

export async function getStats(): Promise<{ total: number; active: number }> {
  const { rows } = await query<{ total: number; active: number }>(
    `SELECT count(*)::int AS total,
    (count(*) FILTER (WHERE status = 'ACTIVE'))::int AS active
    FROM passes`,
  );
  return rows[0];
}

export async function getPasses(): Promise<Pass[]> {
  const { rows } = await query<PassRow>(
    `SELECT id, name, document, issued_at, status FROM passes ORDER BY issued_at DESC`,
  );
  return rows.map(toPass);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function getPass(id: string): Promise<Pass | null> {
  if (!UUID_RE.test(id)) return null;
  const { rows } = await query<PassRow>(
    `SELECT id, name, document, issued_at, status FROM passes WHERE id = $1`,
    [id],
  );
  return rows[0] ? toPass(rows[0]) : null;
}

export async function createPass(name: string, document: string): Promise<Pass> {
  const { rows } = await query<PassRow>(
    `INSERT INTO passes (id, name, document) VALUES ($1, $2, $3)
     RETURNING id, name, document, issued_at, status`,
    [crypto.randomUUID(), name, document],
  );
  return toPass(rows[0]);
}

export async function cancelPass(id: string): Promise<void> {
  await query(`UPDATE passes SET status = 'CANCELLED' WHERE id = $1`, [id]);
}

export async function deletePass(id: string): Promise<void> {
  await query(`DELETE FROM passes WHERE id = $1`, [id]);
}
