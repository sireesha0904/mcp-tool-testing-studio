import {
  connectToMcpServer,
  discoverTools,
  disconnectFromMcpServer,
} from "../services/mcpClient/mcpClient.js";

import { executeToolTest } from "../services/toolTesting/toolTestingService.js";

import { validateTool } from "../services/validation/validationService.js";

import { db } from "../database/database.js";

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

/* ---------------------------------------------------------
   Find or create the tool record
--------------------------------------------------------- */

function getToolId(tool) {
  const existingTool = db
    .prepare(
      `
      SELECT id
      FROM tools
      WHERE name = ?
      LIMIT 1
    `,
    )
    .get(tool.name);

  if (existingTool) {
    return existingTool.id;
  }

  const result = db
    .prepare(
      `
      INSERT INTO tools (
        name,
        description,
        input_schema
      )
      VALUES (?, ?, ?)
    `,
    )
    .run(
      tool.name,
      tool.description || null,
      JSON.stringify(tool.inputSchema || {}),
    );

  return Number(result.lastInsertRowid);
}

/* ---------------------------------------------------------
   Save validation result
--------------------------------------------------------- */

function saveValidationResult(toolId, validationResult) {
  if (!toolId) {
    throw new Error("Tool ID is required to save validation result.");
  }

  if (!validationResult) {
    throw new Error("Validation result is required.");
  }

  const score = Number(validationResult.score || 0);

  const status =
    validationResult.status ||
    (score >= 80
      ? "AGENT_READY"
      : score >= 60
        ? "ALMOST_READY"
        : score >= 40
          ? "NEEDS_WORK"
          : "NOT_READY");

  const checks = validationResult.checks
    ? JSON.stringify(validationResult.checks)
    : null;

  const recommendations = validationResult.recommendations
    ? JSON.stringify(validationResult.recommendations)
    : null;

  /*
   * The validations table may contain different supporting
   * columns depending on the database version. Start with the
   * core fields used by the Reports API.
   */

  const tableInfo = db
    .prepare(
      `
      PRAGMA table_info(validations)
    `,
    )
    .all();

  const availableColumns = new Set(tableInfo.map((column) => column.name));

  const columns = ["tool_id", "score", "status"];
  const values = [toolId, score, status];

  if (availableColumns.has("checks")) {
    columns.push("checks");
    values.push(checks);
  }

  if (availableColumns.has("recommendations")) {
    columns.push("recommendations");
    values.push(recommendations);
  }

  const placeholders = columns.map(() => "?").join(", ");

  const result = db
    .prepare(
      `
      INSERT INTO validations (
        ${columns.join(", ")}
      )
      VALUES (${placeholders})
    `,
    )
    .run(...values);

  return {
    id: Number(result.lastInsertRowid),
    toolId,
    score,
    status,
  };
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
       Save tool metadata
    --------------------------------------------------------- */

    const toolId = getToolId(tool);

    /* ---------------------------------------------------------
       Save validation result to SQLite
    --------------------------------------------------------- */

    const savedValidation = saveValidationResult(toolId, validationResult);

    /* ---------------------------------------------------------
       Return Complete Validation Result
    --------------------------------------------------------- */

    return res.status(200).json({
      success: true,

      tool: {
        id: toolId,
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

      savedValidation,
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
