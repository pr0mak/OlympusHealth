
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
const assistantRoutes = require("./routes/assistantRoutes");

// Middleware
const verifyToken = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// -------------------------------------
// CORS
// -------------------------------------
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

// -------------------------------------
// Body Parsers
// -------------------------------------
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------------
// Request Logger (Development)
// -------------------------------------
if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        console.log("REQUEST:", req.method, req.originalUrl);
        next();
    });
}

// -------------------------------------
// Authentication Rate Limiter
// -------------------------------------
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Πάρα πολλές προσπάθειες. Δοκίμασε αργότερα."
    }
});

// -------------------------------------
// Public Server Health Check
// -------------------------------------
app.get("/healthz", (req, res) => {
    return res.status(200).json({
        success: true,
        status: "online",
        service: "ASTRA API"
    });
});

// -------------------------------------
// Authentication
// -------------------------------------
app.use("/api/auth", authLimiter, authRoutes);

// -------------------------------------
// Protected Dashboard
// -------------------------------------
app.use("/api", verifyToken, dashboardRoutes);

// -------------------------------------
// Protected Health Data
// -------------------------------------
app.use("/api/health", verifyToken, healthRoutes);

// -------------------------------------
// Projection
// Authentication is handled inside
// projectionRoutes.js
// -------------------------------------
app.use("/api/projection", projectionRoutes);

// -------------------------------------
// AI Assistant
// Authentication is handled inside
// assistantRoutes.js
// -------------------------------------
app.use("/api/assistant", assistantRoutes);

// -------------------------------------
// 404 Handler
// -------------------------------------
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Το endpoint δεν βρέθηκε."
    });
});

// -------------------------------------
// Global Error Handler
// -------------------------------------
app.use(errorHandler);

// -------------------------------------
// Server Configuration
// -------------------------------------
const PORT = Number(process.env.PORT || 3001);

async function startServer() {
    try {
        if (
            !process.env.JWT_SECRET ||
            process.env.JWT_SECRET.length < 32
        ) {
            throw new Error("Missing or weak JWT_SECRET");
        }

        // Test MySQL connection
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
