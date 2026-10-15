import { db } from "./database.js";
 
export function saveTestRun(toolId, testResult) {
  if (!toolId) {
    throw new Error("Tool ID is required.");
  }
 
  if (!testResult) {
    throw new Error("Test result is required.");
  }
 
  const status = testResult.success ? "PASSED" : "FAILED";
 
  const inputJson = JSON.stringify(
    testResult.input || {}
  );
 
  const outputJson = testResult.output
    ? JSON.stringify(testResult.output)
    : null;
 
  const errorMessage = testResult.error || null;
 
  const durationMs =
    Number.isFinite(testResult.durationMs)
      ? testResult.durationMs
      : 0;
 
  const result = db
    .prepare(`
      INSERT INTO test_runs (
        tool_id,
        input_json,
        output_json,
        status,
        duration_ms,
        error_message
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      toolId,
      inputJson,
      outputJson,
      status,
      durationMs,
      errorMessage
    );
 
  return {
    id: Number(result.lastInsertRowid),
    status
  };
}
 
export function getTestRunById(id) {
  return db
    .prepare(`
      SELECT *
      FROM test_runs
      WHERE id = ?
    `)
    .get(id);
}
 
export function getTestRunsForTool(toolId) {
  return db
    .prepare(`
      SELECT *
      FROM test_runs
      WHERE tool_id = ?
      ORDER BY created_at DESC
    `)
    .all(toolId);
}
 
export function getAllTestRuns() {
  return db
    .prepare(`
      SELECT
        test_runs.*,
        tools.name AS tool_name
      FROM test_runs
      LEFT JOIN tools
        ON test_runs.tool_id = tools.id
      ORDER BY test_runs.created_at DESC
    `)
    .all();
}
 