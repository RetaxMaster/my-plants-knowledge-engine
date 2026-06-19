import { type RowDataPacket } from 'mysql2/promise';
import { connectToDb } from './lib/db.js';

// List every curated species' scientific name (comma-separated) so the operator can scan what
// we already have and judge — critically — whether the target species is among them. The
// verdict is the operator's; this only surfaces the catalog.
async function main(): Promise<void> {
  const conn = await connectToDb();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT `scientific_name` FROM `species` ORDER BY `scientific_name`',
  );
  await conn.end();

  if (rows.length === 0) {
    console.log('(no species curated yet)');
    return;
  }
  console.log(rows.map((r) => r.scientific_name).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
