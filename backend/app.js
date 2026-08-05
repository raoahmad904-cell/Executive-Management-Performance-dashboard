
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const { EventEmitter } = require("events");

EventEmitter.defaultMaxListeners = 25;

dotenv.config();

const app = express();

// -----------------------------
// Middleware
// -----------------------------

app.use(
    cors({
        origin: ["http://localhost:4200", "http://202.83.167.229:4200"], // Allowed frontend origins
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // Allow cookies/sessions
    })
);

app.use(bodyParser.json());

// -----------------------------
// MongoDB Connection
// -----------------------------

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// -----------------------------
// Routes
// -----------------------------

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/form");
const dashboardRoutes = require("./routes/dashboard");
const directiveRoutes = require("./routes/directive");
const calendarRoutes = require("./routes/calendar");
const calendarMonthTasksRoutes = require("./routes/calendar-month-tasks");
const momRoutes = require("./routes/mom");

app.use("/api/auth", authRoutes);
app.use("/api/form", formRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/directive", directiveRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/calendar", calendarMonthTasksRoutes);
app.use("/api/mom", momRoutes);

// -----------------------------
// Static File Serving
// -----------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -----------------------------
// Server Setup
// -----------------------------

const PORT = process.env.PORT || 3000;

// Bind to all interfaces so devices on the LAN (phones/emulators) can reach it
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT} (all interfaces)`);
});

// -----------------------------
// Graceful Shutdown Logic
// -----------------------------

const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    try {
        await mongoose.connection.close(false);
        console.log("✅ MongoDB connection closed.");

        server.close(() => {
            console.log("✅ HTTP server closed.");
            process.exit(0);
        });
    } catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
    }
};

// Prevent duplicate signal listeners across reloads or PM2 restarts
const signals = ["SIGINT", "SIGTERM"];
for (const sig of signals) {
    if (process.listenerCount(sig) === 0) {
        process.on(sig, () => shutdown(sig));
    }
}

// -----------------------------
// Global Error Handler (optional safety)
// -----------------------------
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Server error" });
});
