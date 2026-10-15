import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
 
import { registerIntegrationTools } from "./tools/integrationTools.js";
 
function createServer() {
  const server = new McpServer({
    name: "mcp-tool-testing-studio-server",
    version: "1.0.0"
  });
 
  registerIntegrationTools(server);
 
  return server;
}
 
void serveStdio(createServer);
 
console.error("MCP Tool Testing Studio server running on stdio");
 