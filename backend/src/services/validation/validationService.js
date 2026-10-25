export function validateTool(tool, testResult, negativeTestResult) {
  const checks = [];
  let score = 0;

  /* ---------------------------------------------------------
     1. Tool Name - 10 points
  --------------------------------------------------------- */

  if (tool && typeof tool.name === "string" && tool.name.trim().length > 0) {
    checks.push({
      name: "Tool Name",
      passed: true,
      score: 10,
      message: "Tool has a valid name.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Tool Name",
      passed: false,
      score: 0,
      message: "Tool name is missing.",
    });
  }

  /* ---------------------------------------------------------
     2. Description - 10 points
  --------------------------------------------------------- */

  if (
    tool &&
    typeof tool.description === "string" &&
    tool.description.trim().length >= 20
  ) {
    checks.push({
      name: "Description",
      passed: true,
      score: 10,
      message: "Tool has a meaningful description.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Description",
      passed: false,
      score: 0,
      message: "Tool description is missing or too short.",
    });
  }

  /* ---------------------------------------------------------
     3. Input Schema - 15 points
  --------------------------------------------------------- */

  if (tool && tool.inputSchema && typeof tool.inputSchema === "object") {
    checks.push({
      name: "Input Schema",
      passed: true,
      score: 15,
      message: "Tool has a valid input schema.",
    });

    score += 15;
  } else {
    checks.push({
      name: "Input Schema",
      passed: false,
      score: 0,
      message: "Input schema is missing.",
    });
  }

  /* ---------------------------------------------------------
     4. Required Parameters - 10 points
  --------------------------------------------------------- */

  const requiredParameters = tool?.inputSchema?.required || [];

  if (requiredParameters.length > 0) {
    checks.push({
      name: "Required Parameters",
      passed: true,
      score: 10,
      message: "Required parameters are clearly defined.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Required Parameters",
      passed: false,
      score: 0,
      message: "No required parameters are defined.",
    });
  }

  /* ---------------------------------------------------------
     5. Parameter Documentation - 10 points
  --------------------------------------------------------- */

  const properties = tool?.inputSchema?.properties || {};

  const propertyNames = Object.keys(properties);

  const allParametersHaveDescriptions =
    propertyNames.length > 0 &&
    propertyNames.every(
      (name) =>
        typeof properties[name]?.description === "string" &&
        properties[name].description.trim().length > 0,
    );

  if (allParametersHaveDescriptions) {
    checks.push({
      name: "Parameter Documentation",
      passed: true,
      score: 10,
      message: "All parameters have descriptions.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Parameter Documentation",
      passed: false,
      score: 0,
      message: "One or more parameters lack descriptions.",
    });
  }

  /* ---------------------------------------------------------
     6. Successful Execution - 10 points
  --------------------------------------------------------- */

  if (testResult?.success === true) {
    checks.push({
      name: "Successful Execution",
      passed: true,
      score: 10,
      message: "Tool executed successfully with valid input.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Successful Execution",
      passed: false,
      score: 0,
      message: "Tool failed during valid execution.",
    });
  }

  /* ---------------------------------------------------------
     7. Error Handling - 10 points
  --------------------------------------------------------- */

  if (
    negativeTestResult &&
    negativeTestResult.success === false &&
    negativeTestResult.error
  ) {
    checks.push({
      name: "Error Handling",
      passed: true,
      score: 10,
      message: "Tool correctly reports invalid input.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Error Handling",
      passed: false,
      score: 0,
      message: "Tool does not provide a detectable error response.",
    });
  }

  /* ---------------------------------------------------------
     8. Response Quality - 10 points
  --------------------------------------------------------- */

  const responseContent =
    testResult?.output ||
    testResult?.result ||
    testResult?.response ||
    testResult?.data;

  const hasResponse = responseContent !== undefined && responseContent !== null;

  if (testResult?.success === true && hasResponse) {
    checks.push({
      name: "Response Quality",
      passed: true,
      score: 10,
      message: "Tool returned a usable execution response.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Response Quality",
      passed: false,
      score: 0,
      message: "Tool response is missing or could not be evaluated.",
    });
  }

  /* ---------------------------------------------------------
     9. Security - 5 points
  --------------------------------------------------------- */

  const toolText = JSON.stringify(tool || {}).toLowerCase();

  const containsUnsafePatterns =
    toolText.includes("password") ||
    toolText.includes("secret") ||
    toolText.includes("private key") ||
    toolText.includes("api_key");

  if (!containsUnsafePatterns) {
    checks.push({
      name: "Security",
      passed: true,
      score: 5,
      message:
        "No obvious secret or credential exposure detected in tool metadata.",
    });

    score += 5;
  } else {
    checks.push({
      name: "Security",
      passed: false,
      score: 0,
      message:
        "Tool metadata may expose sensitive credential-related information.",
    });
  }

  /* ---------------------------------------------------------
     10. Agent Compatibility - 10 points
  --------------------------------------------------------- */

  const hasAgentFriendlyName =
    typeof tool?.name === "string" &&
    /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(tool.name);

  const hasAgentFriendlyDescription =
    typeof tool?.description === "string" &&
    tool.description.trim().length >= 20;

  const hasUsableSchema =
    tool?.inputSchema && typeof tool.inputSchema === "object";

  if (hasAgentFriendlyName && hasAgentFriendlyDescription && hasUsableSchema) {
    checks.push({
      name: "Agent Compatibility",
      passed: true,
      score: 10,
      message:
        "Tool metadata and schema are suitable for agent tool selection and calling.",
    });

    score += 10;
  } else {
    checks.push({
      name: "Agent Compatibility",
      passed: false,
      score: 0,
      message:
        "Tool metadata or schema needs improvement for reliable agent tool calling.",
    });
  }

  /* ---------------------------------------------------------
     Recommendations
  --------------------------------------------------------- */

  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => check.message);

  /* ---------------------------------------------------------
     Final Status
  --------------------------------------------------------- */

  let status = "NOT_READY";

  if (score >= 80) {
    status = "AGENT_READY";
  } else if (score >= 60) {
    status = "ALMOST_READY";
  } else if (score >= 40) {
    status = "NEEDS_WORK";
  }

  return {
    toolName: tool?.name || "Unknown",
    score,
    maxScore: 100,
    status,
    checks,
    recommendations,
  };
}
