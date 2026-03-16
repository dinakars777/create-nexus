# 🧠 create-nexus

> **The Ultimate Agent-Native Boilerplate Generator.**

Most Next.js boilerplates are optimized for human readability.
**Project Nexus** is optimized to be perfectly indexed, mutated, and scaled by AI Coding Agents (Cursor, Claude, Devin) with *zero hallucinations*.

## The Problem
When you ask an AI Agent to "build a feature" in a standard Next.js codebase, it hallucinates. It mixes Pages Router with App Router, it writes raw SQL instead of using your ORM, or it bypasses your API layer entirely to write Server Actions in the UI. 

## The Solution
`create-nexus` generates a fortress. It scaffolds a high-density, strictly-typed environment (Next.js, Hono, Drizzle, Zod) that includes a built-in **Context Control Plane** explicitly designed to govern AI behavior.

### 📦 The Tech Stack
*   **Frontend:** Next.js (App Router) + Tailwind CSS
*   **API:** Hono RPC (End-to-End Type Safety)
*   **Database:** Drizzle ORM + Postgres
*   **Validation:** Strict Zod Boundaries

### 🤖 The Agent-Native Architecture
When you run the generator, you aren't just getting React components. You get:

1.  **The `.agent/` Control Directory**: Contains global `rules.md`, an architectural `project-map.json`, and a `scratchpad.md` for the agent to "think" out loud.
2.  **The Twin-File System**: Every major directory (`src/app`, `src/db`) contains a `CONCEPTS.md`. This defines the Business Logic vs. Implementation boundaries so the agent understands the "why" and doesn't guess context.
3.  **Strict Type-Safety Walls**: Absolute zero `any` types. Every API route uses `zValidator`. If an agent hallucinates an API shape, the Typescript compiler crashes, forcing the agent to read the error and fix itself.
4.  **Verification Hooks**: Pre-configured Husky pre-commit hooks run `tsc --noEmit`. If the agent breaks the build, the Git commit natively fails, forcing it to loop until structurally sound.
5.  **MCP Stub**: An integrated Model Context Protocol server stub (`server/mcp`) allowing local agents to securely query database schemas without reading thousands of lines of code.

## Quickstart

Instantly generate your Agent-Native workspace:

```bash
npx @dinakars777/create-nexus
```

Follow the interactive prompts to name your project. The CLI will handle directory scaffolding, Git initialization, and NPM dependency installations.

## License
MIT
