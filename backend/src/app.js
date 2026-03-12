const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const routes = require('./routes/index');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
const { sanitizeBody } = require('./middlewares/sanitize');
const path = require('path')

const app = express();

// ─── SECURITY: Helmet ─────────────────────────────────────────────────────────
// This is a JSON API — disable CSP (no HTML served), keep all other protections
app.use(
  helmet({
    contentSecurityPolicy: false,   // no HTML served from this API
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,             // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// ─── SECURITY: CORS ───────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  })
);

// ─── RATE LIMITING: Global ────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP across all endpoints
app.use(generalLimiter);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // reject payloads > 10 KB
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── XSS SANITIZATION ────────────────────────────────────────────────────────
// Strip HTML tags from all incoming body string fields
app.use(sanitizeBody);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', message: 'Server is running' });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// Serve uploaded files (e.g., verification documents)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
