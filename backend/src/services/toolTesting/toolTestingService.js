import { testTool } from "../mcpClient/mcpClient.js";
 
export async function executeToolTest(toolName, argumentsObject) {
  const startTime = Date.now();
 
  try {
    const result = await testTool(toolName, argumentsObject);
 
    const durationMs = Date.now() - startTime;
 
    // MCP can return a tool-level error without throwing
    const isToolError = result?.isError === true;
 
    let errorMessage = null;
 
    if (isToolError) {
      const errorContent = result?.content?.find(
        (item) => item.type === "text"
      );
 
      errorMessage =
        errorContent?.text || "MCP tool execution failed";
    }
 
    return {
      success: !isToolError,
      toolName,
      input: argumentsObject,
      output: isToolError ? null : result,
      durationMs,
      error: errorMessage
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
 
    return {
      success: false,
      toolName,
      input: argumentsObject,
      output: null,
      durationMs,
      error: error.message
    };
  }
}
 