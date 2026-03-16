export const honoServerTemplate = `import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';

const app = new Hono().basePath('/api');

// @ai-intent: STRICT ZOD VALIDATION REQUIRED FOR ALL ROUTES
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const routes = app
  .get('/users', async (c) => {
    const allUsers = await db.select().from(users);
    return c.json(allUsers);
  })
  .post('/users', zValidator('json', createUserSchema), async (c) => {
    const { name, email } = c.req.valid('json');
    const result = await db.insert(users).values({ name, email }).returning();
    return c.json(result[0], 201);
  });

export type AppType = typeof routes;
export default app;
`;

export const drizzleSchemaTemplate = `import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';

// @ai-intent: SINGLE SOURCE OF TRUTH. Do not write raw SQL.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
`;

export const drizzleDbTemplate = `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/nexus');
export const db = drizzle(queryClient);
`;

export const nextjsPageTemplate = `import { hc } from 'hono/client';
import { type AppType } from '../server';

// @ai-intent: HONO RPC CLIENT INSTANTIATION
// Agents MUST use this \`client\` to interact with the backend to preserve end-to-end type safety.
const client = hc<AppType>('http://localhost:3000');

export default async function Home() {
  const res = await client.api.users.$get();
  const users = await res.json();

  return (
    <main className="min-h-screen bg-black text-white p-24 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">Project Nexus 🧠</h1>
        <p className="text-zinc-400">
          Agent-Native Boilerplate initialized. Next.js, Hono, Drizzle, and Zod perfectly aligned.
        </p>
        
        <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-950">
          <h2 className="text-xl font-semibold mb-4">Database Users</h2>
          {users.length === 0 ? (
            <p className="text-zinc-500">No users found. Try adding one via the API.</p>
          ) : (
            <ul className="space-y-2">
              {users.map((u: any) => (
                <li key={u.id} className="text-zinc-300">• {u.name} ({u.email})</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
`;
