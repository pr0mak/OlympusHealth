
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
const dashboardRoutes = require("./routes/DashboardRoutes");
const verifyToken = require("./middleware/authMiddleware");

const app = express();

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

// Parse JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        console.log("REQUEST:", req.method, req.originalUrl);
        next();
    });
}

// Rate Limiter for Authentication
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

// Health Check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "online",
        service: "ASTRA API"
    });
});

// Authentication Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", verifyToken, dashboardRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Το endpoint δεν βρέθηκε."
    });
});

// Global Error Handler
app.use(errorHandler);

// Server Configuration
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
            console.log(`ASTRA API running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Startup failed:", error);
        process.exit(1);
    }
}

startServer();
