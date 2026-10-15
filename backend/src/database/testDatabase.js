import { initializeDatabase, db } from "./database.js";
 
try {
  console.log("=================================");
  console.log("DATABASE TEST");
  console.log("=================================\n");
 
  initializeDatabase();
 
  const tables = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `)
    .all();
 
  console.log("\nDATABASE TABLES:\n");
 
  for (const table of tables) {
    console.log(`✓ ${table.name}`);
  }
 
  console.log("\n=================================");
  console.log("DATABASE TEST COMPLETED");
  console.log("=================================");
} catch (error) {
  console.error("\n=================================");
  console.error("DATABASE TEST FAILED");
  console.error("=================================\n");
 
  console.error(error);
 
  process.exit(1);
}