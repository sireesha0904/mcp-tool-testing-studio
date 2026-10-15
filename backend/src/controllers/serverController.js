import { db } from "../database/database.js";
import { connectToMcpServer } from "../services/mcpClient/mcpClient.js";

/**
 * GET /api/servers
 */
export function getServers(req, res) {
  try {
    const servers = db.prepare(`
      SELECT
        id,
        name,
        url,
        transport,
        authentication_type,
        status,
        created_at
      FROM mcp_servers
      ORDER BY id DESC
    `).all();

    res.status(200).json({
      success: true,
      count: servers.length,
      servers
    });
  } catch (error) {
    console.error("Error fetching servers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch MCP servers",
      error: error.message
    });
  }
}


/**
 * GET /api/servers/:id
 */
export function getServerById(req, res) {
  try {
    const { id } = req.params;

    const server = db.prepare(`
      SELECT
        id,
        name,
        url,
        transport,
        authentication_type,
        status,
        created_at
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(id));

    if (!server) {
      return res.status(404).json({
        success: false,
        message: "MCP server not found"
      });
    }

    res.status(200).json({
      success: true,
      server
    });
  } catch (error) {
    console.error("Error fetching server:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch MCP server",
      error: error.message
    });
  }
}


/**
 * POST /api/servers
 */
export function createServer(req, res) {
  try {
    const {
      name,
      url = null,
      transport = "stdio",
      authentication_type = "none",
      status = "DISCONNECTED"
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Server name is required"
      });
    }

    const result = db.prepare(`
      INSERT INTO mcp_servers
      (
        name,
        url,
        transport,
        authentication_type,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      url,
      transport,
      authentication_type,
      status
    );

    const server = db.prepare(`
      SELECT
        id,
        name,
        url,
        transport,
        authentication_type,
        status,
        created_at
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(result.lastInsertRowid));

    res.status(201).json({
      success: true,
      message: "MCP server registered successfully",
      server
    });
  } catch (error) {
    console.error("Error creating server:", error);

    res.status(500).json({
      success: false,
      message: "Failed to register MCP server",
      error: error.message
    });
  }
}


/**
 * PUT /api/servers/:id
 */
export function updateServer(req, res) {
  try {
    const { id } = req.params;

    const existingServer = db.prepare(`
      SELECT *
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(id));

    if (!existingServer) {
      return res.status(404).json({
        success: false,
        message: "MCP server not found"
      });
    }

    const {
      name = existingServer.name,
      url = existingServer.url,
      transport = existingServer.transport,
      authentication_type = existingServer.authentication_type,
      status = existingServer.status
    } = req.body;

    db.prepare(`
      UPDATE mcp_servers
      SET
        name = ?,
        url = ?,
        transport = ?,
        authentication_type = ?,
        status = ?
      WHERE id = ?
    `).run(
      name,
      url,
      transport,
      authentication_type,
      status,
      Number(id)
    );

    const updatedServer = db.prepare(`
      SELECT
        id,
        name,
        url,
        transport,
        authentication_type,
        status,
        created_at
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(id));

    res.status(200).json({
      success: true,
      message: "MCP server updated successfully",
      server: updatedServer
    });
  } catch (error) {
    console.error("Error updating server:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update MCP server",
      error: error.message
    });
  }
}


/**
 * DELETE /api/servers/:id
 */
export function deleteServer(req, res) {
  try {
    const { id } = req.params;

    const existingServer = db.prepare(`
      SELECT *
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(id));

    if (!existingServer) {
      return res.status(404).json({
        success: false,
        message: "MCP server not found"
      });
    }

    db.prepare(`
      DELETE FROM mcp_servers
      WHERE id = ?
    `).run(Number(id));

    res.status(200).json({
      success: true,
      message: "MCP server deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting server:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete MCP server",
      error: error.message
    });
  }
}
/**
 * POST /api/servers/:id/connect
 */
export async function connectServer(req, res) {
  try {
    const { id } = req.params;
 
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
 
    console.log(`Connecting to MCP server: ${server.name}`);
 
    await connectToMcpServer();
 
    db.prepare(`
      UPDATE mcp_servers
      SET status = ?
      WHERE id = ?
    `).run("CONNECTED", Number(id));
 
    const updatedServer = db.prepare(`
      SELECT
        id,
        name,
        url,
        transport,
        authentication_type,
        status,
        created_at
      FROM mcp_servers
      WHERE id = ?
    `).get(Number(id));
 
    res.status(200).json({
      success: true,
      message: "MCP server connected successfully",
      server: updatedServer
    });
 
  } catch (error) {
    console.error("Error connecting to MCP server:", error);
 
    res.status(500).json({
      success: false,
      message: "Failed to connect to MCP server",
      error: error.message
    });
  }
}
 