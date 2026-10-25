/* ----------------------------- Debugging Service ----------------------------- */

const DEBUG_CATEGORIES = {
  INPUT_VALIDATION: "INPUT_VALIDATION",
  SCHEMA: "SCHEMA",
  EXECUTION: "EXECUTION",
  TIMEOUT: "TIMEOUT",
  CONNECTION: "CONNECTION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  MCP_PROTOCOL: "MCP_PROTOCOL",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN: "UNKNOWN",
};

function createAnalysis({ category, severity, message, cause, suggestion }) {
  return {
    hasError: true,
    category,
    severity,
    message,
    cause,
    suggestion,
  };
}

export function analyzeError(errorMessage) {
  const message = String(errorMessage || "").trim();

  if (!message) {
    return {
      hasError: false,
      category: DEBUG_CATEGORIES.UNKNOWN,
      severity: "LOW",
      message: "No error message provided.",
      cause: "The debugging engine did not receive an error message.",
      suggestion: "Provide the MCP tool error message for analysis.",
    };
  }

  const normalized = message.toLowerCase();

  /* ------------------------- Input Validation ------------------------- */

  if (
    normalized.includes("input validation") ||
    normalized.includes("invalid arguments") ||
    normalized.includes("invalid argument") ||
    normalized.includes("required") ||
    normalized.includes("expected string") ||
    normalized.includes("expected number") ||
    normalized.includes("expected boolean") ||
    normalized.includes("expected array") ||
    normalized.includes("expected object") ||
    normalized.includes("received undefined") ||
    normalized.includes("missing parameter") ||
    normalized.includes("missing required")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.INPUT_VALIDATION,
      severity: "MEDIUM",
      message,
      cause: "A required tool parameter is missing or has an invalid value.",
      suggestion:
        "Check the tool input schema and provide all required parameters with the correct data types.",
    });
  }

  /* ------------------------------ Schema ------------------------------ */

  if (
    normalized.includes("schema") ||
    normalized.includes("json schema") ||
    normalized.includes("schema validation") ||
    normalized.includes("invalid schema")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.SCHEMA,
      severity: "MEDIUM",
      message,
      cause:
        "The supplied input or tool definition does not conform to the expected schema.",
      suggestion:
        "Review the MCP tool input schema and make sure the request structure and data types match it.",
    });
  }

  /* ------------------------------ Timeout ----------------------------- */

  if (
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("deadline exceeded")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.TIMEOUT,
      severity: "HIGH",
      message,
      cause:
        "The MCP tool or server did not complete the operation within the allowed time.",
      suggestion:
        "Check server response time, network connectivity, and timeout configuration.",
    });
  }

  /* --------------------------- Connection ----------------------------- */

  if (
    normalized.includes("connection refused") ||
    normalized.includes("connection failed") ||
    normalized.includes("could not connect") ||
    normalized.includes("unable to connect") ||
    normalized.includes("connection closed") ||
    normalized.includes("disconnected") ||
    normalized.includes("connection error")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.CONNECTION,
      severity: "HIGH",
      message,
      cause:
        "The MCP client could not establish or maintain a connection with the MCP server.",
      suggestion:
        "Check that the MCP server is running, the transport configuration is correct, and the connection is available.",
    });
  }

  /* ------------------------- Authentication -------------------------- */

  if (
    normalized.includes("authentication") ||
    normalized.includes("unauthenticated") ||
    normalized.includes("invalid token") ||
    normalized.includes("token expired") ||
    normalized.includes("401")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.AUTHENTICATION,
      severity: "HIGH",
      message,
      cause:
        "The request could not be authenticated with the required credentials.",
      suggestion:
        "Check the configured credentials, token validity, and authentication settings.",
    });
  }

  /* -------------------------- Authorization -------------------------- */

  if (
    normalized.includes("authorization") ||
    normalized.includes("forbidden") ||
    normalized.includes("access denied") ||
    normalized.includes("permission denied") ||
    normalized.includes("403")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.AUTHORIZATION,
      severity: "HIGH",
      message,
      cause:
        "The authenticated caller does not have permission to perform the requested operation.",
      suggestion:
        "Review the user's permissions, roles, scopes, and MCP server authorization configuration.",
    });
  }

  /* ------------------------- MCP Protocol ---------------------------- */

  if (
    normalized.includes("mcp protocol") ||
    normalized.includes("protocol error") ||
    normalized.includes("invalid request") ||
    normalized.includes("invalid response") ||
    normalized.includes("unknown tool") ||
    normalized.includes("method not found") ||
    normalized.includes("protocol")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.MCP_PROTOCOL,
      severity: "HIGH",
      message,
      cause:
        "The MCP client and server did not complete the operation according to the expected MCP protocol behavior.",
      suggestion:
        "Check the MCP request, tool name, protocol message structure, and MCP SDK compatibility.",
    });
  }

  /* --------------------------- Server Error -------------------------- */

  if (
    normalized.includes("server error") ||
    normalized.includes("internal server error") ||
    normalized.includes("500") ||
    normalized.includes("service unavailable") ||
    normalized.includes("502") ||
    normalized.includes("503")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.SERVER_ERROR,
      severity: "HIGH",
      message,
      cause:
        "The MCP server encountered an internal or service-level failure while processing the request.",
      suggestion:
        "Review MCP server logs, tool implementation errors, and returned server error details.",
    });
  }

  /* ----------------------------- Execution ---------------------------- */

  if (
    normalized.includes("execution failed") ||
    normalized.includes("tool execution failed") ||
    normalized.includes("failed to execute") ||
    normalized.includes("execution error")
  ) {
    return createAnalysis({
      category: DEBUG_CATEGORIES.EXECUTION,
      severity: "HIGH",
      message,
      cause: "The MCP tool execution failed after the request was accepted.",
      suggestion:
        "Review the tool input, MCP server logs, and returned error details.",
    });
  }

  /* ------------------------------ Unknown ----------------------------- */

  return createAnalysis({
    category: DEBUG_CATEGORIES.UNKNOWN,
    severity: "MEDIUM",
    message,
    cause:
      "The debugging engine could not confidently classify the MCP tool error.",
    suggestion:
      "Review the complete error message, tool input, MCP server logs, and execution details.",
  });
}
