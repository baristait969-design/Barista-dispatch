import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());

// Immediate health check endpoints for Cloud Run & Google App Engine
app.get(['/healthz', '/health', '/_ah/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Serve static assets from dist
app.use(express.static(distPath, { maxAge: '1h' }));

// SPA fallback routing
app.get('*', (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Barista Central Kitchen</title></head><body style="background:#0D0B0A;color:#F5F0EB;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div>Loading Barista Central Kitchen...</div></body></html>`);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Barista Central Kitchen server listening on 0.0.0.0:${PORT}`);
});

// Graceful shutdown handlers for Cloud Run
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed gracefully');
    process.exit(0);
  });
});

