import fs from 'fs-extra';
import path from 'path';
import { agentRulesTemplate, agentProjectMapTemplate, agentScratchpadTemplate } from './templates/agent';
import { twinAppConceptsTemplate, twinServerConceptsTemplate, twinDbConceptsTemplate } from './templates/twin';
import { honoServerTemplate, nextjsPageTemplate } from './templates/stack';
import { mcpServerTemplate } from './templates/mcp';
import { 
  postgresSchemaTemplate, postgresDbTemplate,
  sqliteSchemaTemplate, sqliteDbTemplate,
  mysqlSchemaTemplate, mysqlDbTemplate,
  getDatabaseDependencies, getDatabaseEnvExample 
} from './templates/database';
import { 
  clerkMiddlewareTemplate, clerkLayoutTemplate, clerkEnvExample,
  nextAuthRouteTemplate, nextAuthEnvExample,
  getAuthDependencies 
} from './templates/auth';
import { tailwindConfigTemplate, postcssConfigTemplate, globalsCssTemplate } from './templates/tailwind';

interface GeneratorOptions {
  template: string;
  database: string;
  auth: string;
}

export async function generateBoilerplate(projectName: string, options: GeneratorOptions) {
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    throw new Error(`Directory ${projectName} already exists.`);
  }

  // 1. Core Directory Scaffolding
  await fs.ensureDir(targetDir);
  const dirs = ['.agent'];

  if (options.template === 'full-stack') {
    dirs.push('src/app', 'src/server', 'src/db', 'server/mcp', '.husky');
  } else if (options.template === 'api-only') {
    dirs.push('src/server', 'src/db', 'server/mcp', '.husky');
  }

  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }

  // 2. The Agent Control Directory
  await fs.writeFile(path.join(targetDir, '.agent/rules.md'), agentRulesTemplate);
  await fs.writeFile(path.join(targetDir, '.agent/project-map.json'), agentProjectMapTemplate);
  await fs.writeFile(path.join(targetDir, '.agent/scratchpad.md'), agentScratchpadTemplate);

  // 3. The Twin-File System (CONCEPTS.md)
  if (options.template !== 'minimal') {
    if (options.template === 'full-stack') {
      await fs.writeFile(path.join(targetDir, 'src/app/CONCEPTS.md'), twinAppConceptsTemplate);
    }
    await fs.writeFile(path.join(targetDir, 'src/server/CONCEPTS.md'), twinServerConceptsTemplate);
    await fs.writeFile(path.join(targetDir, 'src/db/CONCEPTS.md'), twinDbConceptsTemplate);
  }

  // 4. MCP Server Stub
  if (options.template !== 'minimal') {
    await fs.writeFile(path.join(targetDir, 'server/mcp/index.ts'), mcpServerTemplate);
  }

  // 5. Stack Templates (Database)
  if (options.template !== 'minimal') {
    let schemaTemplate, dbTemplate;
    
    switch (options.database) {
      case 'postgresql':
        schemaTemplate = postgresSchemaTemplate;
        dbTemplate = postgresDbTemplate;
        break;
      case 'sqlite':
        schemaTemplate = sqliteSchemaTemplate;
        dbTemplate = sqliteDbTemplate;
        break;
      case 'mysql':
        schemaTemplate = mysqlSchemaTemplate;
        dbTemplate = mysqlDbTemplate;
        break;
      default:
        schemaTemplate = postgresSchemaTemplate;
        dbTemplate = postgresDbTemplate;
    }

    await fs.writeFile(path.join(targetDir, 'src/db/schema.ts'), schemaTemplate);
    await fs.writeFile(path.join(targetDir, 'src/db/index.ts'), dbTemplate);
    await fs.writeFile(path.join(targetDir, 'src/server/index.ts'), honoServerTemplate);
  }

  // 6. Frontend (Next.js)
  if (options.template === 'full-stack') {
    await fs.writeFile(path.join(targetDir, 'src/app/page.tsx'), nextjsPageTemplate);
    
    // Tailwind CSS
    await fs.writeFile(path.join(targetDir, 'tailwind.config.ts'), tailwindConfigTemplate);
    await fs.writeFile(path.join(targetDir, 'postcss.config.mjs'), postcssConfigTemplate);
    await fs.writeFile(path.join(targetDir, 'src/app/globals.css'), globalsCssTemplate);
    
    // Layout
    if (options.auth === 'clerk') {
      await fs.writeFile(path.join(targetDir, 'src/app/layout.tsx'), clerkLayoutTemplate);
      await fs.writeFile(path.join(targetDir, 'src/middleware.ts'), clerkMiddlewareTemplate);
    } else {
      const defaultLayout = `export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
      await fs.writeFile(path.join(targetDir, 'src/app/layout.tsx'), defaultLayout);
    }
    
    // NextAuth route
    if (options.auth === 'nextauth') {
      await fs.ensureDir(path.join(targetDir, 'src/app/api/auth/[...nextauth]'));
      await fs.writeFile(
        path.join(targetDir, 'src/app/api/auth/[...nextauth]/route.ts'),
        nextAuthRouteTemplate
      );
    }
  }

  // 7. Package.json
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {
    "typescript": "^5",
    "@types/node": "^20",
  };

  if (options.template === 'full-stack') {
    Object.assign(dependencies, {
      "next": "14.2.3",
      "react": "^18",
      "react-dom": "^18",
    });
    Object.assign(devDependencies, {
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "postcss": "^8",
      "tailwindcss": "^3.4.1",
      "autoprefixer": "^10.4.18",
    });
  }

  if (options.template !== 'minimal') {
    Object.assign(dependencies, {
      "hono": "^4.3.0",
      "zod": "^3.23.0",
      "@hono/zod-validator": "^0.2.1",
      "@modelcontextprotocol/sdk": "^1.27.1",
      ...getDatabaseDependencies(options.database),
    });
    Object.assign(devDependencies, {
      "drizzle-kit": "^0.21.0",
      "husky": "^9.0.0",
      "lint-staged": "^15.2.0",
    });
  }

  if (options.auth !== 'none') {
    Object.assign(dependencies, getAuthDependencies(options.auth));
  }

  const scripts: Record<string, string> = {};
  
  if (options.template === 'full-stack') {
    Object.assign(scripts, {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
    });
  } else if (options.template === 'api-only') {
    Object.assign(scripts, {
      "dev": "tsx watch src/server/index.ts",
      "build": "tsc",
      "start": "node dist/server/index.js",
    });
    devDependencies["tsx"] = "^4.7.0";
  }

  if (options.template !== 'minimal') {
    Object.assign(scripts, {
      "check": "tsc --noEmit",
      "db:push": "drizzle-kit push",
      "db:studio": "drizzle-kit studio",
      "prepare": "husky install",
    });
  }

  const packageJson = {
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts,
    dependencies,
    devDependencies,
    ...(options.template !== 'minimal' && {
      "lint-staged": {
        "*.ts?(x)": ["tsc --noEmit"]
      }
    })
  };

  await fs.writeJson(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

  // 8. TSConfig
  const tsconfig = {
    "compilerOptions": {
      "lib": options.template === 'full-stack' ? ["dom", "dom.iterable", "esnext"] : ["esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      ...(options.template === 'full-stack' && {
        "jsx": "preserve",
        "incremental": true,
        "plugins": [{ "name": "next" }],
      }),
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": options.template === 'full-stack' 
      ? ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
      : ["src/**/*.ts"],
    "exclude": ["node_modules"]
  };
  await fs.writeJson(path.join(targetDir, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // 9. Husky Pre-commit hook
  if (options.template !== 'minimal') {
    const huskyPreCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run check
`;
    await fs.writeFile(path.join(targetDir, '.husky/pre-commit'), huskyPreCommit);
  }

  // 10. .env.example
  if (options.template !== 'minimal') {
    let envExample = `# Database\n${getDatabaseEnvExample(options.database)}\n\n`;
    
    if (options.template === 'full-stack') {
      envExample += `# Next.js\nNEXT_PUBLIC_API_URL="http://localhost:3000"\n\n`;
    }
    
    if (options.auth === 'clerk') {
      envExample += clerkEnvExample;
    } else if (options.auth === 'nextauth') {
      envExample += nextAuthEnvExample;
    }
    
    await fs.writeFile(path.join(targetDir, '.env.example'), envExample);
  }

  // 11. .cursorrules
  const cursorrules = `# Agent Rules for ${projectName}

## Architecture
${options.template === 'full-stack' ? '- **Frontend**: Next.js App Router (React Server Components)' : ''}
${options.template !== 'minimal' ? '- **API**: Hono RPC with end-to-end type safety' : ''}
${options.template !== 'minimal' ? `- **Database**: Drizzle ORM + ${options.database.charAt(0).toUpperCase() + options.database.slice(1)}` : ''}
${options.template !== 'minimal' ? '- **Validation**: Zod schemas for all inputs' : ''}
${options.auth !== 'none' ? `- **Auth**: ${options.auth === 'clerk' ? 'Clerk' : 'NextAuth.js'}` : ''}

## Critical Rules
1. **Verify Before Commit**: Always run \`npm run check\` before committing. Never commit failing code.
2. **Strict Typing**: Never use \`any\`. Use Zod for all validations.
3. **Twin-Files**: If you create a new directory, create a \`CONCEPTS.md\` explaining its business logic and boundaries.
4. **Architecture Limits**: 
   ${options.template === 'full-stack' ? '- Do not import UI components into the API layer' : ''}
   ${options.template !== 'minimal' ? '- Do not import Drizzle directly into Next.js React UI layer' : ''}
   ${options.template === 'full-stack' ? '- Use the Hono RPC client (\`hc\`) for all frontend-to-backend communication' : ''}
5. **Think First**: Before making massive destructive changes, write your plan in \`.agent/scratchpad.md\`

## Directory Structure
${options.template === 'full-stack' ? '- \`src/app/\` - Next.js routing and React UI pages (read \`src/app/CONCEPTS.md\`)' : ''}
${options.template !== 'minimal' ? '- \`src/server/\` - Hono API backend and RPC routes (read \`src/server/CONCEPTS.md\`)' : ''}
${options.template !== 'minimal' ? '- \`src/db/\` - Drizzle schema operations (read \`src/db/CONCEPTS.md\`)' : ''}
${options.template !== 'minimal' ? '- \`server/mcp/\` - Model Context Protocol stubs for agent querying' : ''}
- \`.agent/\` - Agent control plane (rules, project map, scratchpad)

## Workflow
1. Read the relevant \`CONCEPTS.md\` file before modifying a directory
${options.template !== 'minimal' ? '2. Use \`npm run db:studio\` to visualize the database schema' : ''}
${options.template !== 'minimal' ? '3. Run \`npm run check\` to verify TypeScript compilation' : ''}
4. Check \`.agent/scratchpad.md\` for any ongoing work or notes
`;
  await fs.writeFile(path.join(targetDir, '.cursorrules'), cursorrules);

  // 12. README.md
  const readme = `# ${projectName}

> Agent-Native ${options.template === 'full-stack' ? 'Full-Stack' : options.template === 'api-only' ? 'API' : 'Minimal'} boilerplate generated with [create-nexus](https://github.com/dinakars777/create-nexus)

## Stack

${options.template === 'full-stack' ? '- **Frontend**: Next.js 14 (App Router)' : ''}
${options.template !== 'minimal' ? '- **API**: Hono RPC (end-to-end type safety)' : ''}
${options.template !== 'minimal' ? `- **Database**: Drizzle ORM + ${options.database.charAt(0).toUpperCase() + options.database.slice(1)}` : ''}
${options.template !== 'minimal' ? '- **Validation**: Zod' : ''}
${options.auth !== 'none' ? `- **Auth**: ${options.auth === 'clerk' ? 'Clerk' : 'NextAuth.js'}` : ''}
- **AI Integration**: Built-in \`.agent/\` control plane${options.template !== 'minimal' ? ' + MCP server' : ''}

## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

${options.template !== 'minimal' ? `2. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your ${options.database === 'postgresql' ? 'PostgreSQL' : options.database === 'mysql' ? 'MySQL' : 'SQLite'} credentials
   \`\`\`

3. **Push database schema**:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. **Start development server**:` : '2. **Start development**:'}
   \`\`\`bash
   npm run dev
   \`\`\`

${options.template !== 'minimal' ? `5. **Open Drizzle Studio** (optional):
   \`\`\`bash
   npm run db:studio
   \`\`\`` : ''}

## Architecture

This project follows the **Agent-Native Architecture** pattern:

### The \`.agent/\` Control Plane
- \`rules.md\` - Global rules for AI agents working on this codebase
- \`project-map.json\` - High-level architecture overview
- \`scratchpad.md\` - Temporary workspace for planning complex changes

${options.template !== 'minimal' ? `### The Twin-File System
Each major directory contains a \`CONCEPTS.md\` file that defines:
- Business logic boundaries
- What the directory is responsible for
- What it should NOT do

This prevents AI agents from hallucinating incorrect architectures.` : ''}

## Available Scripts

${options.template === 'full-stack' ? '- \`npm run dev\` - Start Next.js development server' : options.template === 'api-only' ? '- \`npm run dev\` - Start API server with hot reload' : ''}
${options.template !== 'minimal' ? '- \`npm run build\` - Build for production' : ''}
${options.template !== 'minimal' ? '- \`npm run check\` - Run TypeScript type checking' : ''}
${options.template !== 'minimal' ? '- \`npm run db:push\` - Push schema changes to database' : ''}
${options.template !== 'minimal' ? '- \`npm run db:studio\` - Open Drizzle Studio (database GUI)' : ''}

## Working with AI Agents

This project is optimized for AI coding agents (Cursor, Cline, Claude, etc.):

1. **Read \`.cursorrules\`** - Contains all architectural rules
${options.template !== 'minimal' ? '2. **Check \`CONCEPTS.md\`** - Before modifying any directory' : ''}
3. **Use \`.agent/scratchpad.md\`** - For planning complex changes
${options.template !== 'minimal' ? '4. **Run \`npm run check\`** - Before committing (enforced by Husky)' : ''}

## License

MIT
`;
  await fs.writeFile(path.join(targetDir, 'README.md'), readme);
}
