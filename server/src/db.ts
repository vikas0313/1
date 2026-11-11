import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
type StatementSync = any;
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExtendedDatabase {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
  transaction<T>(fn: () => T): () => T;
  close(): void;
}

class DatabaseWrapper implements ExtendedDatabase {
  private db: any;

  constructor(filePath: string) {
    this.db = new (DatabaseSync as any)(filePath);
    this.exec('PRAGMA journal_mode = WAL;');
    this.exec('PRAGMA foreign_keys = ON;');
    this.exec('PRAGMA busy_timeout = 5000;');
  }

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public prepare(sql: string): StatementSync {
    return this.db.prepare(sql);
  }

  public transaction<T>(fn: () => T): () => T {
    return () => {
      this.db.exec('BEGIN TRANSACTION;');
      try {
        const result = fn();
        this.db.exec('COMMIT;');
        return result;
      } catch (err) {
        this.db.exec('ROLLBACK;');
        throw err;
      }
    };
  }

  public close(): void {
    this.db.close();
  }
}

let dbInstance: ExtendedDatabase | null = null;

export function getDb(): ExtendedDatabase {
  if (dbInstance) return dbInstance;

  const rawPath = process.env.DATABASE_PATH || config.DATABASE_PATH;
  let dbPath: string;
  if (rawPath === ':memory:') {
    dbPath = ':memory:';
  } else if (path.isAbsolute(rawPath)) {
    dbPath = rawPath;
  } else {
    dbPath = path.resolve(__dirname, '../../', rawPath);
  }

  if (dbPath !== ':memory:') {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const db = new DatabaseWrapper(dbPath);
  runMigrations(db);

  dbInstance = db;
  return db;
}

export function runMigrations(db: ExtendedDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.resolve(__dirname, '../migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const isAppliedStmt = db.prepare('SELECT id FROM _migrations WHERE id = ?');
  const recordMigrationStmt = db.prepare('INSERT INTO _migrations (id) VALUES (?)');

  for (const file of files) {
    const row = isAppliedStmt.get(file);
    if (!row) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      db.transaction(() => {
        db.exec(sql);
        recordMigrationStmt.run(file);
      })();

      console.log(`[db] Applied migration: ${file}`);
    }
  }
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
