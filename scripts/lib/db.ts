import { createConnection, type Connection } from 'mysql2/promise';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `Missing env var ${name}. Copy .env.example to .env, then export it: set -a; source .env; set +a`,
    );
    process.exit(2);
  }
  return v;
}

// Single place that opens the connection to the API-owned MariaDB, shared by every DB script
// (db:get, db:insert) so the connection contract never drifts between them.
export async function connectToDb(): Promise<Connection> {
  return createConnection({
    host: requireEnv('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requireEnv('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: requireEnv('DB_NAME'),
  });
}
