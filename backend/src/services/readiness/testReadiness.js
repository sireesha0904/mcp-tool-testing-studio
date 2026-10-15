import {
  connectToMcpServer,
  disconnectFromMcpServer,
  discoverTools
} from "../mcpClient/mcpClient.js";
 
import { executeToolTest } from "../toolTesting/toolTestingService.js";
 
import { validateTool } from "../validation/validationService.js";
 
import { calculateAgentReadiness } from "./readinessService.js";
 
try {
  console.log("=================================");
  console.log("AGENT READINESS ENGINE TEST");
  console.log("=================================\n");
 
  // Connect to MCP server
  await connectToMcpServer();
 
  // Discover tools
  const tools = await discoverTools();
 
  const tool = tools.find(
    (item) => item.name === "getIntegrationStatus"
  );
 
  if (!tool) {
    throw new Error(
      "getIntegrationStatus tool was not discovered."
    );
  }
 
  // Valid test
  const testResult = await executeToolTest(
    "getIntegrationStatus",
    {
      integrationId: "INT1001"
    }
  );
 
  // Invalid test
  const negativeTestResult = await executeToolTest(
    "getIntegrationStatus",
    {}
  );
 
  // Validation
  const validationResult = validateTool(
    tool,
    testResult,
    negativeTestResult
  );
 
  // Agent readiness
  const readinessResult =
    calculateAgentReadiness(validationResult);
 
  console.log("=================================");
  console.log("VALIDATION SCORE");
  console.log("=================================\n");
 
  console.log(
    JSON.stringify(validationResult, null, 2)
  );
 
  console.log("\n=================================");
  console.log("AGENT READINESS RESULT");
  console.log("=================================\n");
 
  console.log(
    JSON.stringify(readinessResult, null, 2)
  );
 
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("AGENT READINESS TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("AGENT READINESS TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 