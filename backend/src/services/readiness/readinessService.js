export function calculateAgentReadiness(validationResult) {
  if (!validationResult) {
    return {
      score: 0,
      status: "NOT_READY",
      level: "CRITICAL",
      summary: "No validation result was provided.",
      strengths: [],
      recommendations: [
        "Run tool validation before calculating agent readiness."
      ]
    };
  }
 
  const checks = validationResult.checks || [];
 
  const score = checks.reduce(
    (total, check) => total + (check.passed ? check.score : 0),
    0
  );
 
  const strengths = checks
    .filter((check) => check.passed)
    .map((check) => check.name);
 
  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => {
      switch (check.name) {
        case "Tool Name":
          return "Provide a clear and descriptive tool name.";
 
        case "Description":
          return "Improve the tool description so an AI agent can understand when to use it.";
 
        case "Input Schema":
          return "Define a clear input schema for the tool.";
 
        case "Required Parameters":
          return "Clearly identify which parameters are required.";
 
        case "Parameter Descriptions":
          return "Add meaningful descriptions to all input parameters.";
 
        case "Successful Execution":
          return "Fix the tool execution failure before making it agent-ready.";
 
        case "Error Handling":
          return "Return clear and structured errors for invalid inputs.";
 
        default:
          return `Improve the ${check.name} validation check.`;
      }
    });
 
  let status;
 
  if (score >= 80) {
    status = "AGENT_READY";
  } else if (score >= 60) {
    status = "NEEDS_IMPROVEMENT";
  } else {
    status = "NOT_READY";
  }
 
  let level;
 
  if (score >= 90) {
    level = "EXCELLENT";
  } else if (score >= 80) {
    level = "GOOD";
  } else if (score >= 60) {
    level = "MODERATE";
  } else {
    level = "LOW";
  }
 
  let summary;
 
  if (status === "AGENT_READY") {
    summary =
      "This MCP tool meets the current agent-readiness criteria.";
  } else if (status === "NEEDS_IMPROVEMENT") {
    summary =
      "This MCP tool is usable but requires improvements before agent use.";
  } else {
    summary =
      "This MCP tool is not ready for reliable agent usage.";
  }
 
  return {
    toolName: validationResult.toolName,
    score,
    status,
    level,
    summary,
    strengths,
    recommendations
  };
}
 