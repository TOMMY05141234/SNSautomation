import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const DB_PATH = resolve(process.env.DATABASE_PATH || 'data/sns-growth.db');
let connection;
export function getDb(path = DB_PATH) {
  if (connection && path === DB_PATH) return connection;
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(resolve('db/schema.sql'), 'utf8'));
  if (path === DB_PATH) connection = db;
  return db;
}
export function closeDb() { connection?.close(); connection = undefined; }
