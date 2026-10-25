import express from "express";
import cors from "cors";
import toolRoutes from "./routes/toolRoutes.js";
import debuggingRoutes from "./routes/debuggingRoutes.js";

import serverRoutes from "./routes/serverRoutes.js";
 
const app = express();
 
const PORT = 5000;
 
// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", toolRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api", debuggingRoutes);
 
// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MCP Tool Testing Studio Backend is running"
  });
});
 
// Server APIs
app.use("/api/servers", serverRoutes);
 
// Start server
app.listen(PORT, () => {
  console.log("=================================");
  console.log("MCP TOOL TESTING STUDIO BACKEND");
  console.log("=================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API: http://localhost:5000/api/servers");
});
 