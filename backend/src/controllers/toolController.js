import { db } from "../database/database.js";
import {
  connectToMcpServer,
  discoverTools,
  testTool,
  disconnectFromMcpServer
} from "../services/mcpClient/mcpClient.js";
 
/**
 * GET /api/servers/:id/tools
 * Discover tools from an MCP server
 */
export async function getToolsByServerId(req, res) {
  try {
    const { id } = req.params;
 
    // Check whether server exists in database
    const server = db.prepare(`
      SELECT *
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(id));
 
    if (!server) {
      return res.status(404).json({
        success: false,
        message: "MCP server not found"
      });
    }
 
    console.log(`Discovering tools for MCP server: ${server.name}`);
 
    // Connect to MCP server
    await connectToMcpServer();
 
    // Discover tools dynamically
    const tools = await discoverTools();
 
    // Disconnect after discovery
    await disconnectFromMcpServer();
 
    res.status(200).json({
      success: true,
      server: {
        id: server.id,
        name: server.name
      },
      count: tools.length,
      tools
    });
 
  } catch (error) {
    console.error("Error discovering MCP tools:", error);
 
    try {
      await disconnectFromMcpServer();
    } catch {
      // Ignore disconnect errors
    }
 
    res.status(500).json({
      success: false,
      message: "Failed to discover MCP tools",
      error: error.message
    });
  }
}
/**
 * POST /api/tools/:toolName/test
 * Execute an MCP tool
 */
export async function testMcpTool(req, res) {
  try {
    const { toolName } = req.params;
    const argumentsObject = req.body;
 
    if (!toolName) {
      return res.status(400).json({
        success: false,
        message: "Tool name is required"
      });
    }
 
    console.log(`Testing MCP tool: ${toolName}`);
    console.log("Arguments:", argumentsObject);
 
    // Connect to MCP server
    await connectToMcpServer();
 
    // Execute MCP tool
    const result = await testTool(
      toolName,
      argumentsObject
    );
 
    // Disconnect
    await disconnectFromMcpServer();
 
    // MCP tool execution returned an error
    if (result?.isError === true) {
      let errorMessage = "MCP tool execution failed";
 
      if (result.content?.length > 0) {
        const textContent = result.content.find(
          item => item.type === "text"
        );
 
        if (textContent?.text) {
          errorMessage = textContent.text;
        }
      }
 
      return res.status(400).json({
        success: false,
        tool: toolName,
        arguments: argumentsObject,
        status: "FAILED",
        error: errorMessage,
        rawResult: result
      });
    }
 
    // Successful MCP tool execution
    return res.status(200).json({
      success: true,
      tool: toolName,
      arguments: argumentsObject,
      status: "PASSED",
      result
    });
 
  } catch (error) {
    console.error("Error testing MCP tool:", error);
 
    try {
      await disconnectFromMcpServer();
    } catch {
      // Ignore disconnect errors
    }
 
    return res.status(500).json({
      success: false,
      message: "Failed to execute MCP tool",
      status: "ERROR",
      error: error.message
    });
  }
}
 