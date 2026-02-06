const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

const database = require("./config/database");
const { errorHandler, notFound } = require("./utils/AppError");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const itemRoutes = require("./routes/item.routes");
const categoryRoutes = require("./routes/category.routes");
const saleRoutes = require("./routes/sale.routes");
const alertRoutes = require("./routes/alert.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();
app.set("trust proxy", 1);

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'https://olawale-store.vercel.app',
  'https://olawale-store-v2do.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow REST clients like Postman
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);


// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// ============ ROUTES ============

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Olawale Store API is running",
    timestamp: new Date().toISOString(),
    database: database.isConnected() ? "connected" : "disconnected",
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/items", itemRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============ SERVER ============

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await database.connect();

    // Create indexes
    if (process.env.NODE_ENV !== "production") {
      await database.createIndexes();
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
        database.disconnect();
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
