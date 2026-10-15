import {
  connectToMcpServer,
  disconnectFromMcpServer
} from "../mcpClient/mcpClient.js";
 
import { discoverAndNormalizeTools } from "./toolDiscoveryService.js";
 
try {
  console.log("=================================");
  console.log("TOOL DISCOVERY TEST");
  console.log("=================================\n");
 
  await connectToMcpServer();
 
  const tools = await discoverAndNormalizeTools();
 
  console.log("Discovered Tools:\n");
 
  for (const tool of tools) {
    console.log("---------------------------------");
    console.log(`Name: ${tool.name}`);
    console.log(`Description: ${tool.description}`);
 
    console.log("\nParameters:");
 
    for (const parameter of tool.parameters) {
      console.log(`  Name: ${parameter.name}`);
      console.log(`  Type: ${parameter.type}`);
      console.log(`  Required: ${parameter.required}`);
      console.log(
        `  Description: ${parameter.description}`
      );
      console.log("");
    }
  }
 
  await disconnectFromMcpServer();
 
  console.log("=================================");
  console.log("TOOL DISCOVERY TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("TOOL DISCOVERY TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 