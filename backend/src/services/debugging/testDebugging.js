import {
  connectToMcpServer,
  disconnectFromMcpServer
} from "../mcpClient/mcpClient.js";
 
import { executeToolTest } from "../toolTesting/toolTestingService.js";
 
import { analyzeError } from "./debuggingService.js";
 
try {
  console.log("=================================");
  console.log("DEBUGGING ENGINE TEST");
  console.log("=================================\n");
 
  await connectToMcpServer();
 
  // Intentionally invalid input
  const testResult = await executeToolTest(
    "getIntegrationStatus",
    {}
  );
 
  console.log("Original Test Result:\n");
  console.log(JSON.stringify(testResult, null, 2));
 
  const debugResult = analyzeError(testResult);
 
  console.log("\n=================================");
  console.log("DEBUG ANALYSIS");
  console.log("=================================\n");
 
  console.log(JSON.stringify(debugResult, null, 2));
 
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("DEBUGGING ENGINE TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("DEBUGGING ENGINE TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 
 