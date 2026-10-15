import express from "express";
import {
  getServers,
  getServerById,
  createServer,
  updateServer,
  deleteServer,
  connectServer
} from "../controllers/serverController.js";
 
const router = express.Router();
 
router.get("/", getServers);
 
router.get("/:id", getServerById);
 
router.post("/", createServer);
 
router.put("/:id", updateServer);
 
router.delete("/:id", deleteServer);

router.post("/:id/connect", connectServer);
 
export default router;
 