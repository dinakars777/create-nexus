export const twinAppConceptsTemplate = `# CONCEPTS: Frontend (src/app)

## Business Logic
This directory contains the user-facing React application. It is responsible purely for data presentation and optimistic UI updates.

## Boundaries
- **DO NOT** perform direct database queries (Drizzle) from here.
- **DO NOT** define raw Zod schemas for the database here.
- **DO** use the generated Hono RPC client (e.g., \`hc\`) to communicate with the \`src/server\` API.
- All components should default to React Server Components unless interactive hooks (useState, useEffect) are strictly required (use \`"use client"\`).
`;

export const twinServerConceptsTemplate = `# CONCEPTS: API Backend (src/server)

## Business Logic
This directory houses the Hono API routes. This is the exclusive gateway for all data mutations and retrievals.

## Boundaries
- **MUST** validate all incoming payloads using \`zValidator\` with Zod.
- **MUST** export the \`AppType\` router type so the Next.js frontend can consume the RPC client with end-to-end type safety.
- **DO NOT** import React or UI components into this layer.
`;

export const twinDbConceptsTemplate = `# CONCEPTS: Database Layer (src/db)

## Business Logic
This directory contains the single source of truth for the database schema using Drizzle ORM.

## Boundaries
- **MUST** export Drizzle Select/Insert schemas (e.g., \`createInsertSchema\`) using \`drizzle-zod\`.
- This layer does not execute business logic; it strictly defines the schema shapes and relationships.
`;
