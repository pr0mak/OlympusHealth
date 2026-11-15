require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const db = require("./config/db");

// Routes
const authRoutes = require("./routes/AuthRoutes");
const dashboardRoutes = require("./routes/DashboardRoutes");
const healthRoutes = require("./routes/HealthRoutes");
const projectionRoutes = require("./routes/projectionRoutes");
const futureProjectionRoutes = require("./routes/FutureProjectionRoutes");
const alertRoutes = require("./routes/alertRoutes");
const anatomyRoutes = require("./routes/AnatomyRoutes");

// Middleware
const verifyToken = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Body parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// Development request logger
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.originalUrl);
    next();
  });
}

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Πάρα πολλές προσπάθειες. Δοκίμασε αργότερα.",
  },
});

// Public server health check
app.get("/healthz", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "online",
    service: "ASTRA API",
  });
});

// Authentication
app.use("/api/auth", authLimiter, authRoutes);

// Anatomy - Protected
app.use("/api/anatomy", verifyToken, anatomyRoutes);

// Health Data - Protected
app.use("/api/health", verifyToken, healthRoutes);

// Scientific projection - Protected
app.use("/api/projection", verifyToken, projectionRoutes);

// Future Projection - Protected
app.use(
  "/api/future-projection",
  verifyToken,
  futureProjectionRoutes
);

// Dashboard - Protected
app.use("/api", verifyToken, dashboardRoutes);

// Alerts - Protected
app.use("/api/alerts", verifyToken, alertRoutes);

// 404 Handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Το endpoint δεν βρέθηκε.",
  });
});

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = Number(process.env.PORT || 3001);

async function startServer() {
  try {
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error("Missing or weak JWT_SECRET");
    }

    await db.query("SELECT 1");

    console.log("MySQL connected successfully");

    app.listen(PORT, () => {
      console.log(
        `ASTRA API running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

startServer();
