export const agentRulesTemplate = `# Global Agent Rules
- **Verify Before Commit:** Always run \`pnpm check\` (or \`npm run check\`) which triggers tsc and vitest after a change. Do not commit failing code.
- **Strict Typing:** Never use \`any\`. Use Zod for all validations.
- **Twin-Files:** If you create a new directory, you MUST create a \`CONCEPTS.md\` explaining its business logic and boundaries.
- **Architecture Limits:** Do not import UI components into the API layer. Do not import Drizzle directly into the Next.js React UI layer.
- **Think First:** Before making massive destructive changes, write your plan in \`.agent/scratchpad.md\`.
`;

export const agentProjectMapTemplate = `{
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

export const agentScratchpadTemplate = `# Agent Scratchpad
*Use this file to think out loud, draft complex refactors, or save temporary snippets before applying them to the main codebase.*

## Current Objective
...
`;
