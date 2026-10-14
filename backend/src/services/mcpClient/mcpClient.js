import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
 
let client = null;
let transport = null;
 
export async function connectToMcpServer() {
  client = new Client({
    name: "mcp-tool-testing-studio-client",
    version: "1.0.0"
  });
 
  transport = new StdioClientTransport({
    command: "node",
    args: ["../mcp-server/src/server.js"]
  });
 
  await client.connect(transport);
 
  console.log("Connected to MCP Server");
 
  return client;
}
 
export async function discoverTools() {
  if (!client) {
    throw new Error("MCP client is not connected");
  }
 
  const result = await client.listTools();
 
  return result.tools;
}
 
export async function testTool(toolName, argumentsObject) {
  if (!client) {
    throw new Error("MCP client is not connected");
  }
 
  const result = await client.callTool({
    name: toolName,
    arguments: argumentsObject
  });
 
  return result;
}
 
export async function disconnectFromMcpServer() {
  if (client) {
    await client.close();
 
    client = null;
    transport = null;
 
    console.log("Disconnected from MCP Server");
  }
}
 