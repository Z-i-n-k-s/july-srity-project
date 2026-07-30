const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

const connectDB = require("./config/db");
const apiRouter = require("./routes");
const swaggerSpec = require("./config/swagger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const csrfOriginGuard = require("./middleware/csrfOriginGuard");
const AppError = require("./helpers/AppError");

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

/*
|--------------------------------------------------------------------------
| Swagger Documentation
|--------------------------------------------------------------------------
*/

app.get("/api-docs.json", (_req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "July Smriti Archive API",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      docExpansion: "none",
      withCredentials: true,
    },
  })
);

app.use(helmet());

const allowedOrigins = String(
  process.env.FRONTEND_URL || "http://localhost:3000"
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const backendOrigin = `http://localhost:${Number(process.env.PORT) || 8080}`;

if (!allowedOrigins.includes(backendOrigin)) {
  allowedOrigins.push(backendOrigin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new AppError(
          `Origin ${origin} is not allowed by CORS.`,
          403,
          "CORS_ORIGIN_DENIED"
        )
      );
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(csrfOriginGuard);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests from this client. Please try again later.",
    error: {
      code: "RATE_LIMITED",
      details: null,
    },
  },
});

app.use("/api", globalLimiter);

let connectionPromise;

function ensureDatabase(_req, _res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "The database is temporarily unavailable.",
        503,
        "DATABASE_UNAVAILABLE"
      );
    });
  }

  connectionPromise
    .then(() => next())
    .catch(next);
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "July Smriti API is running.",

    data: {
      database:
        [
          "disconnected",
          "connected",
          "connecting",
          "disconnecting",
        ][mongoose.connection.readyState] || "unknown",

      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api", ensureDatabase, apiRouter);

app.use(notFound);
app.use(errorHandler);



async function startServer() {
  await connectDB();
  

  const port = Number(process.env.PORT) || 8080;

  const server = app.listen(port, () => {
    console.log(`July Smriti API listening on port ${port}.`);
    console.log(
      `Swagger documentation: http://localhost:${port}/api-docs`
    );
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);

    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
}

module.exports = app;