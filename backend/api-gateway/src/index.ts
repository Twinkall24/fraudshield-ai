import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import { WebSocketService } from './websocket';
import pool from './config/database';
import redisClient from './config/redis';

import path from "path";
import { initializeDatabase } from "./config/dbinit";


dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          FRONTEND_ORIGIN,
        ],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

// API Routes — must come before static file serving
app.use('/api', routes);

// Serve React frontend — try multiple common build output paths
const possibleFrontendPaths = [
  path.join(process.cwd(), "frontend", "dist"),   // Vite default
  path.join(process.cwd(), "frontend", "build"),  // CRA default
  path.join(process.cwd(), "client", "dist"),
  path.join(process.cwd(), "client", "build"),
  path.join(process.cwd(), "public"),             // fallback
];

import fs from 'fs';
const frontendBuildPath = possibleFrontendPaths.find(p => fs.existsSync(p)) || path.join(process.cwd(), "public");

console.log(`Serving frontend from: ${frontendBuildPath}`);

app.use(express.static(frontendBuildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// Initialize WebSocket
const wsService = new WebSocketService(server);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');
  });

  await pool.end();
  await redisClient.quit();

  process.exit(0);
});

// Start server — initialize DB schema first, then listen
(async () => {
  await initializeDatabase();

  server.listen(PORT, () => {
    console.log(`
    🚀 Fraud Detection API Gateway
    ================================
    Environment: ${process.env.NODE_ENV}
    Port: ${PORT}
    Frontend: ${frontendBuildPath}
    Database: Connected
    Redis: Connected
    WebSocket: Ready
    ================================
  `);
  });
})();

export { wsService };