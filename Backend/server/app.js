const express = require("express");
const cors = require("cors");
require("dotenv").config();

const dashboardRoutes = require("./routes/DashboardRoutes");
const healthRoutes = require("./routes/HealthRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("ASTRA Backend is working!");
});

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api", dashboardRoutes);

// Health endpoint
app.get("/api/health", (req, res) => {
  console.log("Health endpoint called!");

  res.status(200).json({
    status: "online",
    message: "ASTRA Backend is running!"
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});