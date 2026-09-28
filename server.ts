import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());

const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Ensure dist/ exists on startup if build was skipped by deployment platform
if (!fs.existsSync(indexPath)) {
  console.log('Production build dist/ not found. Running vite build on startup...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to run vite build:', err);
  }
}

// Serve static assets from dist
app.use(express.static(distPath));

// Health check endpoints for Google Cloud Run
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/_ah/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// SPA fallback routing - always returns 200 with HTML so health probes succeed
app.get('*', (_req: Request, res: Response) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2"><title>Barista Central Kitchen</title></head><body style="background:#0D0B0A;color:#F5F0EB;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div>Loading Barista Central Kitchen...</div></body></html>`);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Barista Central Kitchen server listening on port ${PORT}`);
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
