/**
 * Providence Financial Solutions — Debt Relief Comparison
 * Production server for Railway deployment.
 *
 * - Serves static files from project root
 * - Logs PDF exports to logs/pdf-exports.jsonl (append-only)
 * - Health check at /healthz
 * - Graceful shutdown
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'pdf-exports.jsonl');

// Ensure log directory exists
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) { /* ignore */ }

// Security: basic hardening
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Parsers
app.use(express.json({ limit: '32kb' }));

// Health check (Railway uses this)
app.get('/healthz', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// PDF export log endpoint
app.post('/api/pdf-log', (req, res) => {
  const entry = {
    ts: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ua: req.headers['user-agent'],
    ...req.body
  };
  fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
    if (err) {
      console.error('[pdf-log] write failed:', err.message);
      return res.status(500).json({ ok: false });
    }
    res.json({ ok: true });
  });
});

// Static assets (cached)
app.use(express.static(path.join(__dirname), {
  maxAge: '1h',
  setHeaders: (res, p) => {
    if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Providence dashboard running on :${PORT}`);
});

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach(sig => {
  process.on(sig, () => {
    console.log(`${sig} received — closing server`);
    server.close(() => process.exit(0));
  });
});
