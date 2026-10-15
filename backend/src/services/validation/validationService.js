export function validateTool(tool, testResult, negativeTestResult) {
  const checks = [];
  let score = 0;
 
  // 1. Tool name
  if (
    tool &&
    typeof tool.name === "string" &&
    tool.name.trim().length > 0
  ) {
    checks.push({
      name: "Tool Name",
      passed: true,
      score: 10,
      message: "Tool has a valid name."
    });
 
    score += 10;
  } else {
    checks.push({
      name: "Tool Name",
      passed: false,
      score: 0,
      message: "Tool name is missing."
    });
  }
 
  // 2. Description
  if (
    tool &&
    typeof tool.description === "string" &&
    tool.description.trim().length >= 20
  ) {
    checks.push({
      name: "Description",
      passed: true,
      score: 10,
      message: "Tool has a meaningful description."
    });
 
    score += 10;
  } else {
    checks.push({
      name: "Description",
      passed: false,
      score: 0,
      message: "Tool description is missing or too short."
    });
  }
 
  // 3. Input schema
  if (
    tool &&
    tool.inputSchema &&
    typeof tool.inputSchema === "object"
  ) {
    checks.push({
      name: "Input Schema",
      passed: true,
      score: 15,
      message: "Tool has a valid input schema."
    });
 
    score += 15;
  } else {
    checks.push({
      name: "Input Schema",
      passed: false,
      score: 0,
      message: "Input schema is missing."
    });
  }
 
  // 4. Required parameters
  const requiredParameters =
    tool?.inputSchema?.required || [];
 
  if (requiredParameters.length > 0) {
    checks.push({
      name: "Required Parameters",
      passed: true,
      score: 15,
      message: "Required parameters are defined."
    });
 
    score += 15;
  } else {
    checks.push({
      name: "Required Parameters",
      passed: false,
      score: 0,
      message: "No required parameters are defined."
    });
  }
 
  // 5. Parameter descriptions
  const properties =
    tool?.inputSchema?.properties || {};
 
  const propertyNames = Object.keys(properties);
 
  const allParametersHaveDescriptions =
    propertyNames.length > 0 &&
    propertyNames.every(
      (name) =>
        typeof properties[name]?.description === "string" &&
        properties[name].description.trim().length > 0
    );
 
  if (allParametersHaveDescriptions) {
    checks.push({
      name: "Parameter Descriptions",
      passed: true,
      score: 10,
      message: "All parameters have descriptions."
    });
 
    score += 10;
  } else {
    checks.push({
      name: "Parameter Descriptions",
      passed: false,
      score: 0,
      message: "One or more parameters lack descriptions."
    });
  }
 
  // 6. Successful execution
  if (testResult?.success === true) {
    checks.push({
      name: "Successful Execution",
      passed: true,
      score: 15,
      message: "Tool executed successfully with valid input."
    });
 
    score += 15;
  } else {
    checks.push({
      name: "Successful Execution",
      passed: false,
      score: 0,
      message: "Tool failed during valid execution."
    });
  }
 
  // 7. Error handling
  if (
    negativeTestResult &&
    negativeTestResult.success === false &&
    negativeTestResult.error
  ) {
    checks.push({
      name: "Error Handling",
      passed: true,
      score: 10,
      message: "Tool correctly reports invalid input."
    });
 
    score += 10;
  } else {
    checks.push({
      name: "Error Handling",
      passed: false,
      score: 0,
      message: "Tool does not provide a detectable error response."
    });
  }
 
  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => check.message);
 
  return {
    toolName: tool?.name || "Unknown",
    score,
    status:
      score >= 80
        ? "AGENT_READY"
        : score >= 60
          ? "NEEDS_IMPROVEMENT"
          : "NOT_READY",
    checks,
    recommendations
  };
}
 