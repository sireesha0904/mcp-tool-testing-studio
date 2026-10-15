import express from "express";
 
import {
  getToolsByServerId,
  testMcpTool
} from "../controllers/toolController.js";
 
const router = express.Router();
 
/**
* GET /api/servers/:id/tools
*/
router.get("/servers/:id/tools", getToolsByServerId);
router.post("/tools/:toolName/test", testMcpTool);
 
export default router;