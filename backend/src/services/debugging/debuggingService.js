export function analyzeError(testResult) {
  if (!testResult) {
    return {
      hasError: true,
      category: "UNKNOWN",
      severity: "HIGH",
      message: "No test result was provided.",
      cause: "The debugging engine did not receive a test result.",
      suggestion: "Run the MCP tool again and provide the test result."
    };
  }
 
  if (testResult.success) {
    return {
      hasError: false,
      category: "NONE",
      severity: "INFO",
      message: "Tool execution completed successfully.",
      cause: null,
      suggestion: "No debugging action is required."
    };
  }
 
  const errorMessage = testResult.error || "";
 
  // Missing or invalid parameter
  if (
    errorMessage.includes("expected string") ||
    errorMessage.includes("received undefined") ||
    errorMessage.includes("Invalid arguments")
  ) {
    return {
      hasError: true,
      category: "INPUT_VALIDATION",
      severity: "MEDIUM",
      message: errorMessage,
      cause: "A required tool parameter is missing or has an invalid value.",
      suggestion:
        "Check the tool input schema and provide all required parameters with the correct data types."
    };
  }
 
  // Tool not found
  if (
    errorMessage.includes("Tool not found") ||
    errorMessage.includes("Unknown tool")
  ) {
    return {
      hasError: true,
      category: "TOOL_NOT_FOUND",
      severity: "HIGH",
      message: errorMessage,
      cause: "The requested MCP tool is not available on the connected server.",
      suggestion:
        "Refresh tool discovery and verify that the tool name is correct."
    };
  }
 
  // Connection-related errors
  if (
    errorMessage.includes("connection") ||
    errorMessage.includes("Connection") ||
    errorMessage.includes("transport")
  ) {
    return {
      hasError: true,
      category: "CONNECTION",
      severity: "HIGH",
      message: errorMessage,
      cause: "The MCP client could not communicate correctly with the MCP server.",
      suggestion:
        "Check the MCP server status, transport configuration, and connection."
    };
  }
 
  // Generic fallback
  return {
    hasError: true,
    category: "EXECUTION",
    severity: "HIGH",
    message: errorMessage,
    cause: "The MCP tool execution failed.",
    suggestion:
      "Review the tool input, MCP server logs, and returned error details."
  };
}