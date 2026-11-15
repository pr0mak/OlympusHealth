
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Database
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

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// ==========================================
// BODY PARSERS
// ==========================================

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// DEVELOPMENT REQUEST LOGGER
// ==========================================

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(
      "REQUEST:",
      req.method,
      req.originalUrl
    );

    next();
  });
}

// ==========================================
// AUTHENTICATION RATE LIMITER
// ==========================================

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

// ==========================================
// PUBLIC HEALTH CHECK
// ==========================================

app.get("/healthz", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "online",
    service: "ASTRA API",
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

// ==========================================
// ANATOMY ROUTES - PROTECTED
// ==========================================

app.use(
  "/api/anatomy",
  verifyToken,
  anatomyRoutes
);

// ==========================================
// HEALTH DATA ROUTES - PROTECTED
// ==========================================

app.use(
  "/api/health",
  verifyToken,
  healthRoutes
);

// ==========================================
// SCIENTIFIC PROJECTION - PROTECTED
// ==========================================

app.use(
  "/api/projection",
  verifyToken,
  projectionRoutes
);

// ==========================================
// FUTURE PROJECTION - PROTECTED
// ==========================================

app.use(
  "/api/future-projection",
  verifyToken,
  futureProjectionRoutes
);

// ==========================================
// ALERT ROUTES - PROTECTED
// ==========================================

app.use(
  "/api/alerts",
  verifyToken,
  alertRoutes
);

// ==========================================
// DASHBOARD ROUTES - PROTECTED
// ==========================================

app.use(
  "/api",
  verifyToken,
  dashboardRoutes
);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Το endpoint δεν βρέθηκε.",
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

// ==========================================
// SERVER CONFIGURATION
// ==========================================

const PORT = Number(process.env.PORT || 3001);

async function startServer() {
  try {
    // Validate JWT secret
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error("Missing or weak JWT_SECRET");
    }

    // Check MySQL connection
    await db.query("SELECT 1");

    console.log("MySQL connected successfully");

    // Start Express server
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
