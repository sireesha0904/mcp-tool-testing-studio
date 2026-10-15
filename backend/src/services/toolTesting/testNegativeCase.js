import {
  connectToMcpServer,
  disconnectFromMcpServer
} from "../mcpClient/mcpClient.js";
 
import { executeToolTest } from "./toolTestingService.js";
 
try {
  console.log("=================================");
  console.log("NEGATIVE TEST");
  console.log("=================================\n");
 
  // Connect to MCP server
  await connectToMcpServer();
 
  // Intentionally invalid input
  // integrationId is required but is missing
  const result = await executeToolTest(
    "getIntegrationStatus",
    {}
  );
 
  console.log("Negative Test Result:\n");
  console.log(JSON.stringify(result, null, 2));
 
  // Disconnect
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("NEGATIVE TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("NEGATIVE TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 