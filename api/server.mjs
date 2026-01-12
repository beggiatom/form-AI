import http from 'node:http';
import { URL } from 'node:url';
import handler from './openai.js';

const port = Number(process.env.API_PORT) || 3001;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/api/openai') {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length) {
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      req.body = raw ? JSON.parse(raw) : undefined;
    } catch {
      req.body = undefined;
    }
  }

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };

  await handler(req, res);
});

server.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});
