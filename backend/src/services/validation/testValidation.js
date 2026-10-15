import {
  connectToMcpServer,
  disconnectFromMcpServer,
  discoverTools
} from "../mcpClient/mcpClient.js";
 
import { executeToolTest } from "../toolTesting/toolTestingService.js";
 
import { validateTool } from "./validationService.js";
 
try {
  console.log("=================================");
  console.log("VALIDATION ENGINE TEST");
  console.log("=================================\n");
 
  // Connect to MCP server
  await connectToMcpServer();
 
  // Discover MCP tools
  const tools = await discoverTools();
 
  if (!tools || tools.length === 0) {
    throw new Error("No MCP tools were discovered.");
  }
 
  // Use the first discovered tool
  const tool = tools.find(
    (item) => item.name === "getIntegrationStatus"
  );
 
  if (!tool) {
    throw new Error(
      "getIntegrationStatus tool was not discovered."
    );
  }
 
  // Valid execution
  const testResult = await executeToolTest(
    "getIntegrationStatus",
    {
      integrationId: "INT1001"
    }
  );
 
  // Invalid execution
  const negativeTestResult = await executeToolTest(
    "getIntegrationStatus",
    {}
  );
 
  // Validate tool
  const validationResult = validateTool(
    tool,
    testResult,
    negativeTestResult
  );
 
  console.log("Tool:\n");
  console.log(JSON.stringify(tool, null, 2));
 
  console.log("\n=================================");
  console.log("VALIDATION RESULT");
  console.log("=================================\n");
 
  console.log(
    JSON.stringify(validationResult, null, 2)
  );
 
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("VALIDATION ENGINE TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("VALIDATION ENGINE TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 