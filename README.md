# create-nexus 🧠

[![npm version](https://img.shields.io/npm/v/@dinakars777/create-nexus.svg?style=flat-square)](https://www.npmjs.com/package/@dinakars777/create-nexus)
[![npm downloads](https://img.shields.io/npm/dm/@dinakars777/create-nexus.svg?style=flat-square)](https://www.npmjs.com/package/@dinakars777/create-nexus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> The Ultimate Agent-Native Boilerplate Generator.

Most Next.js boilerplates are optimized for human readability. **create-nexus** is optimized to be perfectly indexed, mutated, and scaled by AI coding agents (Cursor, Claude, Devin) with zero hallucinations.

## The Problem

When you ask an AI agent to "build a feature" in a standard Next.js codebase, it hallucinates. It mixes Pages Router with App Router, writes raw SQL instead of using your ORM, or bypasses your API layer entirely. **create-nexus** generates a fortress that governs AI behavior by design.

## Quick Start

```bash
npx @dinakars777/create-nexus
```

Follow the interactive prompts. The CLI handles directory scaffolding, Git initialization, and dependency installation.

## What You Get

| Feature | Description |
|---|---|
| `.agent/` Control Directory | `rules.md`, `project-map.json`, and `scratchpad.md` for agent context |
| Twin-File System | `CONCEPTS.md` in every major directory defining business logic boundaries |
| Strict Type-Safety | Zero `any` types, Zod-validated API routes — compiler crashes on hallucinations |
| Verification Hooks | Husky pre-commit hooks run `tsc --noEmit` — broken builds can't be committed |
| MCP Stub | Integrated Model Context Protocol server for secure local DB schema queries |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS |
| API | Hono RPC (end-to-end type safety) |
| Database | Drizzle ORM + Postgres |
| Validation | Zod |

## Templates

The generator supports multiple project types:

| Template | Description |
|---|---|
| `stack` | Full-stack Next.js + Hono + Drizzle |
| `agent` | AI agent scaffold with `.agent/` control plane |
| `mcp` | Model Context Protocol server stub |
| `twin` | Twin-file system with `CONCEPTS.md` structure |

## License

MIT
