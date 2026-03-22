#!/usr/bin/env node

// src/index.ts
import { intro, outro, spinner, text, confirm, isCancel } from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";

// src/generator.ts
import fs from "fs-extra";
import path from "path";

// src/templates/agent.ts
var agentRulesTemplate = `# Global Agent Rules
- **Verify Before Commit:** Always run \`pnpm check\` (or \`npm run check\`) which triggers tsc and vitest after a change. Do not commit failing code.
- **Strict Typing:** Never use \`any\`. Use Zod for all validations.
- **Twin-Files:** If you create a new directory, you MUST create a \`CONCEPTS.md\` explaining its business logic and boundaries.
- **Architecture Limits:** Do not import UI components into the API layer. Do not import Drizzle directly into the Next.js React UI layer.
- **Think First:** Before making massive destructive changes, write your plan in \`.agent/scratchpad.md\`.
`;
var agentProjectMapTemplate = `{
  "name": "nexus-app",
  "architecture": {
    "frontend": "Next.js App Router (React Server Components)",
    "api": "Hono RPC",
    "database": "Drizzle ORM + SQLite",
    "validation": "Zod"
  },
  "directories": {
    "src/app": "Next.js Routing and React UI Pages",
    "src/server": "Hono API backend and RCP routes",
    "src/db": "Drizzle schema operations",
    "server/mcp": "Model Context Protocol stubs"
  }
}
`;
var agentScratchpadTemplate = `# Agent Scratchpad
*Use this file to think out loud, draft complex refactors, or save temporary snippets before applying them to the main codebase.*

## Current Objective
...
`;

// src/templates/twin.ts
var twinAppConceptsTemplate = `# CONCEPTS: Frontend (src/app)

## Business Logic
This directory contains the user-facing React application. It is responsible purely for data presentation and optimistic UI updates.

## Boundaries
- **DO NOT** perform direct database queries (Drizzle) from here.
- **DO NOT** define raw Zod schemas for the database here.
- **DO** use the generated Hono RPC client (e.g., \`hc\`) to communicate with the \`src/server\` API.
- All components should default to React Server Components unless interactive hooks (useState, useEffect) are strictly required (use \`"use client"\`).
`;
var twinServerConceptsTemplate = `# CONCEPTS: API Backend (src/server)

## Business Logic
This directory houses the Hono API routes. This is the exclusive gateway for all data mutations and retrievals.

## Boundaries
- **MUST** validate all incoming payloads using \`zValidator\` with Zod.
- **MUST** export the \`AppType\` router type so the Next.js frontend can consume the RPC client with end-to-end type safety.
- **DO NOT** import React or UI components into this layer.
`;
var twinDbConceptsTemplate = `# CONCEPTS: Database Layer (src/db)

## Business Logic
This directory contains the single source of truth for the database schema using Drizzle ORM.

## Boundaries
- **MUST** export Drizzle Select/Insert schemas (e.g., \`createInsertSchema\`) using \`drizzle-zod\`.
- This layer does not execute business logic; it strictly defines the schema shapes and relationships.
`;

// src/templates/stack.ts
var honoServerTemplate = `import { Hono } from 'hono';
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
var drizzleSchemaTemplate = `import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';

// @ai-intent: SINGLE SOURCE OF TRUTH. Do not write raw SQL.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
`;
var drizzleDbTemplate = `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/nexus');
export const db = drizzle(queryClient);
`;
var nextjsPageTemplate = `import { hc } from 'hono/client';
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
        <h1 className="text-4xl font-bold tracking-tight">Project Nexus \u{1F9E0}</h1>
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
                <li key={u.id} className="text-zinc-300">\u2022 {u.name} ({u.email})</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
`;

// src/templates/mcp.ts
var mcpServerTemplate = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import fs from 'fs';

// @ai-intent: MCP SERVER STUB
// Agents can connect to this server via stdio to execute read-only queries against the environment.

const server = new Server(
  { name: "nexus-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_drizzle_schema",
        description: "Returns the raw text of the current Drizzle database schema to maintain context without hallucinating.",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "check_build_health",
        description: "Runs typescript compiler checks to verify if the codebase currently has any type errors.",
        inputSchema: { type: "object", properties: {}, required: [] },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_drizzle_schema") {
    try {
      const schema = fs.readFileSync('./src/db/schema.ts', 'utf-8');
      return { toolResult: schema };
    } catch {
      return { toolResult: "Schema file not found." };
    }
  }
  
  if (request.params.name === "check_build_health") {
    try {
      const output = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
      return { toolResult: output || "Build is perfectly healthy. No type errors." };
    } catch (e: any) {
      return { toolResult: \`Type errors detected:\\n\${e.stdout}\` };
    }
  }

  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
`;

// src/generator.ts
async function generateBoilerplate(projectName) {
  const targetDir = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(targetDir)) {
    throw new Error(`Directory ${projectName} already exists.`);
  }
  await fs.ensureDir(targetDir);
  const dirs = [
    "src/app",
    "src/server",
    "src/db",
    "server/mcp",
    ".agent",
    ".husky"
  ];
  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }
  await fs.writeFile(path.join(targetDir, ".agent/rules.md"), agentRulesTemplate);
  await fs.writeFile(path.join(targetDir, ".agent/project-map.json"), agentProjectMapTemplate);
  await fs.writeFile(path.join(targetDir, ".agent/scratchpad.md"), agentScratchpadTemplate);
  await fs.writeFile(path.join(targetDir, "src/app/CONCEPTS.md"), twinAppConceptsTemplate);
  await fs.writeFile(path.join(targetDir, "src/server/CONCEPTS.md"), twinServerConceptsTemplate);
  await fs.writeFile(path.join(targetDir, "src/db/CONCEPTS.md"), twinDbConceptsTemplate);
  await fs.writeFile(path.join(targetDir, "server/mcp/index.ts"), mcpServerTemplate);
  await fs.writeFile(path.join(targetDir, "src/server/index.ts"), honoServerTemplate);
  await fs.writeFile(path.join(targetDir, "src/db/schema.ts"), drizzleSchemaTemplate);
  await fs.writeFile(path.join(targetDir, "src/db/index.ts"), drizzleDbTemplate);
  await fs.writeFile(path.join(targetDir, "src/app/page.tsx"), nextjsPageTemplate);
  const packageJson = {
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "check": "tsc --noEmit",
      "db:push": "drizzle-kit push",
      "db:studio": "drizzle-kit studio",
      "prepare": "husky install"
    },
    dependencies: {
      "next": "14.2.3",
      "react": "^18",
      "react-dom": "^18",
      "hono": "^4.3.0",
      "zod": "^3.23.0",
      "@hono/zod-validator": "^0.2.1",
      "drizzle-orm": "^0.30.0",
      "postgres": "^3.4.4",
      "@modelcontextprotocol/sdk": "^1.27.1"
    },
    devDependencies: {
      "typescript": "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "postcss": "^8",
      "tailwindcss": "^3.4.1",
      "drizzle-kit": "^0.21.0",
      "husky": "^9.0.0",
      "lint-staged": "^15.2.0"
    },
    "lint-staged": {
      "*.ts?(x)": [
        "tsc --noEmit"
      ]
    }
  };
  await fs.writeJson(path.join(targetDir, "package.json"), packageJson, { spaces: 2 });
  const tsconfig = {
    "compilerOptions": {
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  };
  await fs.writeJson(path.join(targetDir, "tsconfig.json"), tsconfig, { spaces: 2 });
  const huskyPreCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run check
`;
  await fs.writeFile(path.join(targetDir, ".husky/pre-commit"), huskyPreCommit);
  const envExample = `# Database
DATABASE_URL="postgres://localhost:5432/nexus"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
`;
  await fs.writeFile(path.join(targetDir, ".env.example"), envExample);
  const cursorrules = `# Agent Rules for ${projectName}

## Architecture
- **Frontend**: Next.js App Router (React Server Components)
- **API**: Hono RPC with end-to-end type safety
- **Database**: Drizzle ORM + PostgreSQL
- **Validation**: Zod schemas for all inputs

## Critical Rules
1. **Verify Before Commit**: Always run \`npm run check\` before committing. Never commit failing code.
2. **Strict Typing**: Never use \`any\`. Use Zod for all validations.
3. **Twin-Files**: If you create a new directory, create a \`CONCEPTS.md\` explaining its business logic and boundaries.
4. **Architecture Limits**: 
   - Do not import UI components into the API layer
   - Do not import Drizzle directly into Next.js React UI layer
   - Use the Hono RPC client (\`hc\`) for all frontend-to-backend communication
5. **Think First**: Before making massive destructive changes, write your plan in \`.agent/scratchpad.md\`

## Directory Structure
- \`src/app/\` - Next.js routing and React UI pages (read \`src/app/CONCEPTS.md\`)
- \`src/server/\` - Hono API backend and RPC routes (read \`src/server/CONCEPTS.md\`)
- \`src/db/\` - Drizzle schema operations (read \`src/db/CONCEPTS.md\`)
- \`server/mcp/\` - Model Context Protocol stubs for agent querying
- \`.agent/\` - Agent control plane (rules, project map, scratchpad)

## Workflow
1. Read the relevant \`CONCEPTS.md\` file before modifying a directory
2. Use \`npm run db:studio\` to visualize the database schema
3. Run \`npm run check\` to verify TypeScript compilation
4. Check \`.agent/scratchpad.md\` for any ongoing work or notes
`;
  await fs.writeFile(path.join(targetDir, ".cursorrules"), cursorrules);
  const readme = `# ${projectName}

> Agent-Native Next.js boilerplate generated with [create-nexus](https://github.com/dinakars777/create-nexus)

## Stack

- **Frontend**: Next.js 14 (App Router)
- **API**: Hono RPC (end-to-end type safety)
- **Database**: Drizzle ORM + PostgreSQL
- **Validation**: Zod
- **AI Integration**: Built-in \`.agent/\` control plane + MCP server

## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   \`\`\`

3. **Push database schema**:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open Drizzle Studio** (optional):
   \`\`\`bash
   npm run db:studio
   \`\`\`

## Architecture

This project follows the **Agent-Native Architecture** pattern:

### The \`.agent/\` Control Plane
- \`rules.md\` - Global rules for AI agents working on this codebase
- \`project-map.json\` - High-level architecture overview
- \`scratchpad.md\` - Temporary workspace for planning complex changes

### The Twin-File System
Each major directory contains a \`CONCEPTS.md\` file that defines:
- Business logic boundaries
- What the directory is responsible for
- What it should NOT do

This prevents AI agents from hallucinating incorrect architectures.

### Directory Structure

\`\`\`
${projectName}/
\u251C\u2500\u2500 .agent/              # Agent control plane
\u251C\u2500\u2500 src/
\u2502   \u251C\u2500\u2500 app/            # Next.js pages (read CONCEPTS.md)
\u2502   \u251C\u2500\u2500 server/         # Hono API routes (read CONCEPTS.md)
\u2502   \u2514\u2500\u2500 db/             # Drizzle schema (read CONCEPTS.md)
\u251C\u2500\u2500 server/
\u2502   \u2514\u2500\u2500 mcp/            # Model Context Protocol server
\u251C\u2500\u2500 .cursorrules        # AI IDE integration (Cursor, Cline)
\u2514\u2500\u2500 .husky/             # Git hooks (pre-commit type checking)
\`\`\`

## Available Scripts

- \`npm run dev\` - Start Next.js development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run check\` - Run TypeScript type checking
- \`npm run db:push\` - Push schema changes to database
- \`npm run db:studio\` - Open Drizzle Studio (database GUI)

## Working with AI Agents

This project is optimized for AI coding agents (Cursor, Cline, Claude, etc.):

1. **Read \`.cursorrules\`** - Contains all architectural rules
2. **Check \`CONCEPTS.md\`** - Before modifying any directory
3. **Use \`.agent/scratchpad.md\`** - For planning complex changes
4. **Run \`npm run check\`** - Before committing (enforced by Husky)

## License

MIT
`;
  await fs.writeFile(path.join(targetDir, "README.md"), readme);
}

// src/index.ts
import { execa } from "execa";
var program = new Command();
program.name("create-nexus").description("Scaffold the ultimate Agent-Native Boilerplate.").version("1.0.0");
program.action(async () => {
  console.log();
  intro(pc.inverse(pc.bold(" \u{1F9E0} CREATE NEXUS: Agent-Native Stack ")));
  const projectName = await text({
    message: "What is your project named?",
    placeholder: "my-agent-app",
    validate(value) {
      if (!value || value.length === 0) return "Project name is required!";
      if (/^[a-zA-Z0-9-]+$/.test(value) === false) return "Project name can only contain letters, numbers, and dashes.";
    }
  });
  if (isCancel(projectName)) {
    outro("Operation cancelled.");
    process.exit(0);
  }
  const s = spinner();
  s.start(`Scaffolding Agent-Native architecture into ${projectName}...`);
  try {
    await generateBoilerplate(projectName);
    s.stop(pc.green("\u2713 Scaffold instantiated successfully."));
  } catch (err) {
    s.stop(pc.red("\u2716 Failed to generate project."));
    console.error(pc.red(err.message));
    process.exit(1);
  }
  console.log();
  console.log(pc.bold("Included in this High-Density Stack:"));
  console.log(pc.cyan("  \u2022 Next.js App Router") + " (Frontend)");
  console.log(pc.cyan("  \u2022 Hono RPC") + " (Type-safe API Backend)");
  console.log(pc.cyan("  \u2022 Drizzle ORM + SQLite") + " (Strict Zod Schemas)");
  console.log(pc.cyan("  \u2022 The Twin-File Architecture") + " (CONCEPTS.md context layer)");
  console.log(pc.cyan("  \u2022 Integrated MCP Stub") + " (server/mcp for Agent querying)");
  console.log(pc.cyan("  \u2022 Husky + tsc") + " (Strict commit verification hooks)");
  console.log();
  const installDeps = await confirm({
    message: "Would you like to install dependencies now? (npm install)",
    initialValue: true
  });
  if (isCancel(installDeps)) {
    outro("Operation cancelled.");
    process.exit(0);
  }
  if (installDeps) {
    s.start("Installing dependencies via npm...");
    try {
      await execa("npm", ["install"], { cwd: projectName });
      s.stop(pc.green("\u2713 Dependencies installed."));
    } catch {
      s.stop(pc.red("\u2716 Failed to install dependencies. You can run npm install manually later."));
    }
  }
  const initGit = await confirm({
    message: "Initialize a new Git repository?",
    initialValue: true
  });
  if (!isCancel(initGit) && initGit) {
    try {
      await execa("git", ["init"], { cwd: projectName });
      console.log(pc.green("\u2713 Git repository initialized."));
    } catch {
    }
  }
  console.log();
  console.log(pc.bgGreen(" SUCCESS! ") + ` Project ${projectName} is ready for an AI Agent to dominate.`);
  console.log("Next steps:");
  console.log(pc.bold(`  cd ${projectName}`));
  console.log(pc.bold("  npm run dev"));
  outro("Good luck building!");
});
program.parse(process.argv);
