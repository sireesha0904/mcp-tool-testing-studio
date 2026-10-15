import { initializeDatabase } from "./database.js";
 
import {
  getToolByName
} from "./toolRepository.js";
 
import {
  saveTestRun,
  getTestRunsForTool
} from "./testRunRepository.js";
 
import {
  connectToMcpServer,
  discoverTools,
  disconnectFromMcpServer
} from "../services/mcpClient/mcpClient.js";
 
import {
  executeToolTest
} from "../services/toolTesting/toolTestingService.js";
 
try {
  console.log("=================================");
  console.log("TEST RUN REPOSITORY TEST");
  console.log("=================================\n");
 
  // Initialize database
  initializeDatabase();
 
  // Connect to MCP server
  await connectToMcpServer();
 
  // Discover tools
  const tools = await discoverTools();
 
  console.log(`Discovered ${tools.length} MCP tool(s).\n`);
 
  // Save discovered tools if they are not already stored
  for (const tool of tools) {
    const existingTool = getToolByName(tool.name);
 
    if (!existingTool) {
      throw new Error(
        `Tool ${tool.name} is not present in database.`
      );
    }
  }
 
  // Get database record for our test tool
  const databaseTool = getToolByName(
    "getIntegrationStatus"
  );
 
  if (!databaseTool) {
    throw new Error(
      "getIntegrationStatus was not found in database."
    );
  }
 
  console.log(
    `Using database tool ID: ${databaseTool.id}\n`
  );
 
  // ---------------------------------
  // VALID TEST
  // ---------------------------------
 
  console.log("Running valid test...\n");
 
  const validResult = await executeToolTest(
    "getIntegrationStatus",
    {
      integrationId: "INT1001"
    }
  );
 
  const validSaved = saveTestRun(
    databaseTool.id,
    validResult
  );
 
  console.log("Valid Test:");
  console.log(`Status: ${validSaved.status}`);
  console.log(`Database ID: ${validSaved.id}`);
  console.log(
    `Duration: ${validResult.durationMs} ms`
  );
 
  console.log("---------------------------------\n");
 
  // ---------------------------------
  // NEGATIVE TEST
  // ---------------------------------
 
  console.log("Running negative test...\n");
 
  const negativeResult = await executeToolTest(
    "getIntegrationStatus",
    {}
  );
 
  const negativeSaved = saveTestRun(
    databaseTool.id,
    negativeResult
  );
 
  console.log("Negative Test:");
  console.log(`Status: ${negativeSaved.status}`);
  console.log(`Database ID: ${negativeSaved.id}`);
  console.log(
    `Duration: ${negativeResult.durationMs} ms`
  );
 
  console.log("---------------------------------\n");
 
  // ---------------------------------
  // READ HISTORY
  // ---------------------------------
 
  const history = getTestRunsForTool(
    databaseTool.id
  );
 
  console.log("=================================");
  console.log("TEST HISTORY");
  console.log("=================================\n");
 
  for (const run of history) {
    console.log(`Run ID: ${run.id}`);
    console.log(`Status: ${run.status}`);
    console.log(`Input: ${run.input_json}`);
    console.log(`Duration: ${run.duration_ms} ms`);
 
    if (run.error_message) {
      console.log(`Error: ${run.error_message}`);
    }
 
    console.log("---------------------------------");
  }
 
  await disconnectFromMcpServer();
 
  console.log("\n=================================");
  console.log("TEST RUN REPOSITORY TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("TEST RUN REPOSITORY TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}
 