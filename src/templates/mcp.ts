export const mcpServerTemplate = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
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
