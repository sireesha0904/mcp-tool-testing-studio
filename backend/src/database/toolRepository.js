import { db } from "./database.js";
 
export function saveTool(tool, serverId = null) {
  if (!tool || !tool.name) {
    throw new Error("Invalid tool: tool name is required.");
  }
 
  const existingTool = db
    .prepare(`
      SELECT id
      FROM tools
      WHERE name = ?
        AND (
          server_id = ?
          OR (server_id IS NULL AND ? IS NULL)
        )
      LIMIT 1
    `)
    .get(tool.name, serverId, serverId);
 
  if (existingTool) {
    db.prepare(`
      UPDATE tools
      SET
        description = ?,
        input_schema = ?,
        output_schema = ?,
        discovered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      tool.description || "",
      JSON.stringify(tool.inputSchema || {}),
      JSON.stringify(tool.outputSchema || {}),
      existingTool.id
    );
 
    return {
      id: existingTool.id,
      action: "UPDATED"
    };
  }
 
  const result = db
    .prepare(`
      INSERT INTO tools (
        server_id,
        name,
        description,
        input_schema,
        output_schema
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      serverId,
      tool.name,
      tool.description || "",
      JSON.stringify(tool.inputSchema || {}),
      JSON.stringify(tool.outputSchema || {})
    );
 
  return {
    id: Number(result.lastInsertRowid),
    action: "INSERTED"
  };
}
 
export function getToolById(id) {
  return db
    .prepare(`
      SELECT *
      FROM tools
      WHERE id = ?
    `)
    .get(id);
}
 
export function getToolByName(name) {
  return db
    .prepare(`
      SELECT *
      FROM tools
      WHERE name = ?
      LIMIT 1
    `)
    .get(name);
}
 
export function getAllTools() {
  return db
    .prepare(`
      SELECT *
      FROM tools
      ORDER BY discovered_at DESC
    `)
    .all();
}
 