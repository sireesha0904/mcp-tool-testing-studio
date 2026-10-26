import express from "express";
import cors from "cors";

import toolRoutes from "./routes/toolRoutes.js";
import debuggingRoutes from "./routes/debuggingRoutes.js";
import serverRoutes from "./routes/serverRoutes.js";
import validationRoutes from "./routes/validationRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import "dotenv/config";
import agentRoutes from "./routes/agentRoutes.js";

const app = express();

const PORT = 5000;

/* ---------------------------------------------------------
   Middleware
--------------------------------------------------------- */

app.use(cors());
app.use(express.json());

/* ---------------------------------------------------------
   API Routes
--------------------------------------------------------- */

app.use("/api", toolRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api", debuggingRoutes);
app.use("/api", validationRoutes);
app.use("/api", historyRoutes);
app.use("/api", reportRoutes);
app.use("/api", agentRoutes);

/* ---------------------------------------------------------
   Health Check
--------------------------------------------------------- */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MCP Tool Testing Studio Backend is running",
  });
});

/* ---------------------------------------------------------
   Start Server
--------------------------------------------------------- */

app.listen(PORT, () => {
  console.log("=================================");
  console.log("MCP TOOL TESTING STUDIO BACKEND");
  console.log("=================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API: http://localhost:5000/api/servers");
});
