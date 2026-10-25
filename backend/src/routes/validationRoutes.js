import express from "express";

import { validateToolEndpoint } from "../controllers/validationController.js";

const router = express.Router();

router.post("/tools/:toolName/validate", validateToolEndpoint);

export default router;
