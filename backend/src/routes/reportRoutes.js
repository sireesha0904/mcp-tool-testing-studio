import express from "express";

import { getQualityReport } from "../controllers/reportController.js";

const router = express.Router();

/* ---------------------------------------------------------
   Quality Report
--------------------------------------------------------- */

router.get("/reports/quality", getQualityReport);

export default router;
