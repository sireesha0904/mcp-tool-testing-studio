import express from "express";

import {
  getHistory,
  getHistoryById,
  getHistoryForTool,
} from "../controllers/historyController.js";

const router = express.Router();

// Get all test execution history
router.get("/history", getHistory);

// Get one test execution by ID
router.get("/history/:id", getHistoryById);

// Get test execution history for a specific tool
router.get("/tools/:toolId/history", getHistoryForTool);

export default router;
