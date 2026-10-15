import { initializeDatabase } from "./database.js";
 
import {
  saveTool,
  getAllTools,
  getToolByName
} from "./toolRepository.js";
 
import {
  connectToMcpServer,
  discoverTools,
  disconnectFromMcpServer
} from "../services/mcpClient/mcpClient.js";
 
try {
  console.log("=================================");
  console.log("TOOL REPOSITORY TEST");
  console.log("=================================\n");
 
  // Initialize SQLite database
  initializeDatabase();
 
  // Connect to MCP server
  await connectToMcpServer();
 
  // Discover tools dynamically
  const tools = await discoverTools();
 
  console.log(`Discovered ${tools.length} MCP tool(s).\n`);
 
  // Store every discovered tool
  for (const tool of tools) {
    const result = saveTool(tool);
 
    console.log(`Tool: ${tool.name}`);
    console.log(`Database Action: ${result.action}`);
    console.log(`Database ID: ${result.id}`);
    console.log("---------------------------------");
  }
 
  // Display all stored tools
  const storedTools = getAllTools();
 
  console.log("\n=================================");
  console.log("TOOLS STORED IN DATABASE");
  console.log("=================================\n");
 
  for (const tool of storedTools) {
    console.log(`ID: ${tool.id}`);
    console.log(`Name: ${tool.name}`);
    console.log(`Description: ${tool.description}`);
    console.log(`Input Schema: ${tool.input_schema}`);
    console.log("---------------------------------");
  }
 
  // Verify our known tool
  const savedTool = getToolByName("getIntegrationStatus");
 
  if (!savedTool) {
    throw new Error(
      "getIntegrationStatus was not found in the database."
    );
  }
 
  console.log("\n=================================");
  console.log("DATABASE VERIFICATION");
  console.log("=================================\n");
 
  console.log("✓ getIntegrationStatus found in database");
  console.log(`✓ Database ID: ${savedTool.id}`);
  console.log(`✓ Tool Name: ${savedTool.name}`);
 
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("TOOL REPOSITORY TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("TOOL REPOSITORY TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 