import {
  connectToMcpServer,
  discoverTools,
  disconnectFromMcpServer,
} from "../services/mcpClient/mcpClient.js";

import { executeToolTest } from "../services/toolTesting/toolTestingService.js";

import { validateTool } from "../services/validation/validationService.js";

function generateTestArguments(inputSchema = {}) {
  const properties = inputSchema?.properties || {};
  const required = inputSchema?.required || [];

  const argumentsObject = {};

  for (const parameterName of required) {
    const parameter = properties[parameterName] || {};

    switch (parameter.type) {
      case "string":
        argumentsObject[parameterName] = parameterName
          .toLowerCase()
          .includes("id")
          ? "INT1001"
          : "test-value";
        break;

      case "number":
      case "integer":
        argumentsObject[parameterName] = 1;
        break;

      case "boolean":
        argumentsObject[parameterName] = true;
        break;

      case "array":
        argumentsObject[parameterName] = [];
        break;

      case "object":
        argumentsObject[parameterName] = {};
        break;

      default:
        argumentsObject[parameterName] = "test-value";
    }
  }

  return argumentsObject;
}

export async function validateToolEndpoint(req, res) {
  let connected = false;

  try {
    const { toolName } = req.params;

    if (!toolName || !String(toolName).trim()) {
      return res.status(400).json({
        success: false,
        message: "toolName is required",
      });
    }

    /* ---------------------------------------------------------
       Connect to MCP Server
    --------------------------------------------------------- */

    await connectToMcpServer();
    connected = true;

    /* ---------------------------------------------------------
       Discover Tools
    --------------------------------------------------------- */

    const tools = await discoverTools();

    const tool = tools.find((item) => item.name === toolName);

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: `MCP tool '${toolName}' was not found`,
      });
    }

    /* ---------------------------------------------------------
       Generate valid test input from schema
    --------------------------------------------------------- */

    const validArguments = generateTestArguments(tool.inputSchema);

    /* ---------------------------------------------------------
       Positive Test
    --------------------------------------------------------- */

    const testResult = await executeToolTest(toolName, validArguments);

    /* ---------------------------------------------------------
       Negative Test
       Empty object intentionally tests required parameters
    --------------------------------------------------------- */

    const negativeTestResult = await executeToolTest(toolName, {});

    /* ---------------------------------------------------------
       Run Validation Engine
    --------------------------------------------------------- */

    const validationResult = validateTool(tool, testResult, negativeTestResult);

    /* ---------------------------------------------------------
       Return Complete Validation Result
    --------------------------------------------------------- */

    return res.status(200).json({
      success: true,
      tool: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      test: {
        input: validArguments,
        result: testResult,
      },
      negativeTest: {
        input: {},
        result: negativeTestResult,
      },
      validation: validationResult,
    });
  } catch (error) {
    console.error("Validation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to validate MCP tool",
      error: error.message,
    });
  } finally {
    if (connected) {
      try {
        await disconnectFromMcpServer();
      } catch (disconnectError) {
        console.error("Failed to disconnect from MCP server:", disconnectError);
      }
    }
  }
}
