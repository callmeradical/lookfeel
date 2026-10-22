import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OutputStore } from './output-store.js';
import { FeedbackStore } from './feedback-store.js';
import { DEFAULT_DIMENSIONS } from './dimensions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIEWER_DIR = path.resolve(__dirname, '../viewer');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

export function startViewerServer(options = {}) {
  const port = options.port || 8802;
  const outputStore = new OutputStore(options.outputDir);
  const feedbackStore = new FeedbackStore(options.feedbackDir || path.join(outputStore.baseDir, 'feedback'));

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (pathname === '/api/dimensions' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(DEFAULT_DIMENSIONS));
    }

    if (pathname === '/api/runs' && req.method === 'GET') {
      const runs = outputStore.listRuns();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ runs }));
    }

    if (pathname.startsWith('/api/runs/') && req.method === 'GET') {
      const runId = pathname.replace('/api/runs/', '');
      const runData = outputStore.getRun(runId);
      if (!runData) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Run not found' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(runData));
    }

    if (pathname === '/api/feedback' && req.method === 'GET') {
      const screenId = url.searchParams.get('screenId');
      const records = feedbackStore.listEvaluations(screenId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ feedback: records }));
    }

    if (pathname === '/api/feedback' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const record = feedbackStore.recordEvaluation(payload);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, record }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Static image serving from runs/latest
    if (pathname.startsWith('/images/')) {
      const subPath = pathname.replace('/images/', '');
      const filePath = path.join(outputStore.runsDir, subPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        return fs.createReadStream(filePath).pipe(res);
      }
      const latestPath = path.join(outputStore.latestDir, subPath);
      if (fs.existsSync(latestPath) && fs.statSync(latestPath).isFile()) {
        const ext = path.extname(latestPath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        return fs.createReadStream(latestPath).pipe(res);
      }
      res.writeHead(404);
      return res.end('Image not found');
    }

    // Serve viewer frontend
    let filePath = path.join(VIEWER_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(VIEWER_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`[lookfeel] 🎨 Visual Review Studio running on http://localhost:${port}`);
  });

  return server;
}
