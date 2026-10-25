import {
  getAllTestRuns,
  getTestRunById,
  getTestRunsForTool,
} from "../database/testRunRepository.js";

export function getHistory(req, res) {
  try {
    const history = getAllTestRuns();

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Failed to load test history:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load test history.",
      message: error.message,
    });
  }
}

export function getHistoryById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid test run ID.",
      });
    }

    const testRun = getTestRunById(id);

    if (!testRun) {
      return res.status(404).json({
        success: false,
        error: "Test run not found.",
      });
    }

    return res.json({
      success: true,
      testRun,
    });
  } catch (error) {
    console.error("Failed to load test run:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load test run.",
      message: error.message,
    });
  }
}

export function getHistoryForTool(req, res) {
  try {
    const toolId = Number(req.params.toolId);

    if (!Number.isInteger(toolId) || toolId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid tool ID.",
      });
    }

    const history = getTestRunsForTool(toolId);

    return res.json({
      success: true,
      toolId,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Failed to load tool test history:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load tool test history.",
      message: error.message,
    });
  }
}
