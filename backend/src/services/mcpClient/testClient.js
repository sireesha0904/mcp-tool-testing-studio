console.log("TEST CLIENT STARTED");
 
import {
  connectToMcpServer,
  discoverTools,
  testTool,
  disconnectFromMcpServer
} from "./mcpClient.js";
 
try {
  // 1. Connect to MCP server
  await connectToMcpServer();
 
  // 2. Discover tools
  const tools = await discoverTools();
 
  console.log("\n=================================");
  console.log("DISCOVERED MCP TOOLS");
  console.log("=================================\n");
 
  for (const tool of tools) {
    console.log(`Tool Name: ${tool.name}`);
    console.log(`Description: ${tool.description}`);
 
    console.log("Input Schema:");
    console.log(JSON.stringify(tool.inputSchema, null, 2));
 
    console.log("---------------------------------\n");
  }
 
  // 3. Test the discovered tool
  console.log("=================================");
  console.log("TESTING TOOL");
  console.log("=================================\n");
 
  const result = await testTool("getIntegrationStatus", {
    integrationId: "INT1001"
  });
 
  console.log("Tool Response:");
  console.log(JSON.stringify(result, null, 2));
 
  // 4. Disconnect
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("MCP CLIENT TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("MCP CLIENT TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
  process.exit(1);
}
 