// PostgreSQL templates
export const postgresSchemaTemplate = `import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';

// @ai-intent: SINGLE SOURCE OF TRUTH. Do not write raw SQL.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
`;

export const postgresDbTemplate = `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/nexus');
export const db = drizzle(queryClient);
`;

// SQLite templates
export const sqliteSchemaTemplate = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// @ai-intent: SINGLE SOURCE OF TRUTH. Do not write raw SQL.
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
`;

export const sqliteDbTemplate = `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database(process.env.DATABASE_URL || './local.db');
export const db = drizzle(sqlite);
`;

// MySQL templates
export const mysqlSchemaTemplate = `import { mysqlTable, varchar, int, timestamp } from 'drizzle-orm/mysql-core';

// @ai-intent: SINGLE SOURCE OF TRUTH. Do not write raw SQL.
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
`;

export const mysqlDbTemplate = `import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL || 'mysql://localhost:3306/nexus'
});

export const db = drizzle(connection);
`;

export function getDatabaseDependencies(database: string) {
  switch (database) {
    case 'postgresql':
      return {
        'drizzle-orm': '^0.30.0',
        'postgres': '^3.4.4',
      };
    case 'sqlite':
      return {
        'drizzle-orm': '^0.30.0',
        'better-sqlite3': '^9.4.0',
      };
    case 'mysql':
      return {
        'drizzle-orm': '^0.30.0',
        'mysql2': '^3.9.0',
      };
    default:
      return {};
  }
}

export function getDatabaseEnvExample(database: string) {
  switch (database) {
    case 'postgresql':
      return 'DATABASE_URL="postgres://localhost:5432/nexus"';
    case 'sqlite':
      return 'DATABASE_URL="./local.db"';
    case 'mysql':
      return 'DATABASE_URL="mysql://localhost:3306/nexus"';
    default:
      return '';
  }
}
