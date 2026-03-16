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
  // Ensure the hook is executable (not natively supported by fs.writeFile easily cross-platform, but good enough for a generated boilerplate before install)

}
