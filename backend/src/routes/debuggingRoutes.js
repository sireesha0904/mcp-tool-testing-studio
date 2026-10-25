import express from "express";
import { analyzeToolError } from "../controllers/debuggingController.js";

const router = express.Router();

router.post("/tools/:toolName/analyze-error", analyzeToolError);

export default router;
