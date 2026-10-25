import { analyzeError } from "../services/debugging/debuggingService.js";

export async function analyzeToolError(req, res) {
  try {
    const { toolName } = req.params;
    const { errorMessage } = req.body;

    if (!errorMessage || !String(errorMessage).trim()) {
      return res.status(400).json({
        success: false,
        message: "errorMessage is required"
      });
    }

    const analysis = analyzeError(errorMessage);

    return res.status(200).json({
      success: true,
      toolName,
      analysis
    });
  } catch (error) {
    console.error("Debugging analysis failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze error",
      error: error.message
    });
  }
}
