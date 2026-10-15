import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const dataDirectory = path.join(__dirname, "../../data");
 
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}
 
const databasePath = path.join(dataDirectory, "mcp-testing-studio.db");
 
export const db = new DatabaseSync(databasePath);
 
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT,
      transport TEXT NOT NULL,
      authentication_type TEXT,
      status TEXT DEFAULT 'DISCONNECTED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
 
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      input_schema TEXT,
      output_schema TEXT,
      discovered_at TEXT DEFAULT CURRENT_TIMESTAMP,
 
      FOREIGN KEY (server_id)
        REFERENCES mcp_servers(id)
    );
 
    CREATE TABLE IF NOT EXISTS test_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER,
      input_json TEXT,
      output_json TEXT,
      status TEXT,
      duration_ms INTEGER,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 
      FOREIGN KEY (tool_id)
        REFERENCES tools(id)
    );
 
    CREATE TABLE IF NOT EXISTS validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER,
      score INTEGER,
      status TEXT,
      checks_json TEXT,
      recommendations TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 
      FOREIGN KEY (tool_id)
        REFERENCES tools(id)
    );
 
    CREATE TABLE IF NOT EXISTS agent_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      endpoint TEXT,
      authentication_type TEXT,
      status TEXT DEFAULT 'DISCONNECTED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
 
  console.log("Database initialized successfully");
  console.log(`Database: ${databasePath}`);
}
 