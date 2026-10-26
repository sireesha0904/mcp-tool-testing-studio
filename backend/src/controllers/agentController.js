import { runAgent } from "../services/agent/agentService.js";

export async function runAgentController(req, res) {
  try {
    const { message, serverConfig } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
      });
    }

    const result = await runAgent({
      message,
      serverConfig,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Agent error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Agent execution failed.",
    });
  }
}
