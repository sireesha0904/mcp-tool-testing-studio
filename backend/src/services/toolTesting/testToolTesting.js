import {
  connectToMcpServer,
  disconnectFromMcpServer
} from "../mcpClient/mcpClient.js";
 
import { executeToolTest } from "./toolTestingService.js";
 
try {
  console.log("=================================");
  console.log("TOOL TESTING ENGINE TEST");
  console.log("=================================\n");
 
  // Connect to MCP server
  await connectToMcpServer();
 
  // Execute valid tool test
  const result = await executeToolTest(
    "getIntegrationStatus",
    {
      integrationId: "INT1001"
    }
  );
 
  console.log("Test Result:\n");
  console.log(JSON.stringify(result, null, 2));
 
  // Disconnect
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("TOOL TESTING ENGINE TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("TOOL TESTING ENGINE TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 