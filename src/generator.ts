import fs from 'fs-extra';
import path from 'path';
import { agentRulesTemplate, agentProjectMapTemplate, agentScratchpadTemplate } from './templates/agent';
import { twinAppConceptsTemplate, twinServerConceptsTemplate, twinDbConceptsTemplate } from './templates/twin';
import { honoServerTemplate, drizzleSchemaTemplate, drizzleDbTemplate, nextjsPageTemplate } from './templates/stack';
import { mcpServerTemplate } from './templates/mcp';

export async function generateBoilerplate(projectName: string) {
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    throw new Error(`Directory ${projectName} already exists.`);
  }

  // 1. Core Directory Scaffolding
  await fs.ensureDir(targetDir);
  const dirs = [
    'src/app',
    'src/server',
    'src/db',
    'server/mcp',
    '.agent',
    '.husky'
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }

  // 2. The Agent Control Directory
  await fs.writeFile(path.join(targetDir, '.agent/rules.md'), agentRulesTemplate);
  await fs.writeFile(path.join(targetDir, '.agent/project-map.json'), agentProjectMapTemplate);
  await fs.writeFile(path.join(targetDir, '.agent/scratchpad.md'), agentScratchpadTemplate);

  // 3. The Twin-File System (CONCEPTS.md)
  await fs.writeFile(path.join(targetDir, 'src/app/CONCEPTS.md'), twinAppConceptsTemplate);
  await fs.writeFile(path.join(targetDir, 'src/server/CONCEPTS.md'), twinServerConceptsTemplate);
  await fs.writeFile(path.join(targetDir, 'src/db/CONCEPTS.md'), twinDbConceptsTemplate);

  // 4. MCP Server Stub
  await fs.writeFile(path.join(targetDir, 'server/mcp/index.ts'), mcpServerTemplate);

  // 5. Stack Templates
  await fs.writeFile(path.join(targetDir, 'src/server/index.ts'), honoServerTemplate);
  await fs.writeFile(path.join(targetDir, 'src/db/schema.ts'), drizzleSchemaTemplate);
  await fs.writeFile(path.join(targetDir, 'src/db/index.ts'), drizzleDbTemplate);
  await fs.writeFile(path.join(targetDir, 'src/app/page.tsx'), nextjsPageTemplate);

  // 6. Base Package Config & Verification Hooks (Husky)
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

  await fs.writeJson(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

  // TSConfig
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
  await fs.writeJson(path.join(targetDir, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // Husky Pre-commit hook
  const huskyPreCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run check
`;
  await fs.writeFile(path.join(targetDir, '.husky/pre-commit'), huskyPreCommit);

  // 7. Generate .env.example
  const envExample = `# Database
DATABASE_URL="postgres://localhost:5432/nexus"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
`;
  await fs.writeFile(path.join(targetDir, '.env.example'), envExample);

  // 8. Generate .cursorrules for AI IDE integration
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
  await fs.writeFile(path.join(targetDir, '.cursorrules'), cursorrules);

  // 9. Generate README.md
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
├── .agent/              # Agent control plane
├── src/
│   ├── app/            # Next.js pages (read CONCEPTS.md)
│   ├── server/         # Hono API routes (read CONCEPTS.md)
│   └── db/             # Drizzle schema (read CONCEPTS.md)
├── server/
│   └── mcp/            # Model Context Protocol server
├── .cursorrules        # AI IDE integration (Cursor, Cline)
└── .husky/             # Git hooks (pre-commit type checking)
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
  await fs.writeFile(path.join(targetDir, 'README.md'), readme);

}
