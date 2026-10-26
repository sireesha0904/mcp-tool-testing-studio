import express from "express";
import { runAgentController } from "../controllers/agentController.js";

const router = express.Router();

router.post("/agents/run", runAgentController);

export default router;
