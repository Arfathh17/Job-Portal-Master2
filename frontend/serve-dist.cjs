const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:5000';
const root = path.join(__dirname, 'dist');

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname.startsWith('/api')) {
    const proxyReq = http.request(
      new URL(`${url.pathname}${url.search}`, apiTarget),
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(apiTarget).host,
        },
      },
      proxyRes => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend API is not reachable' }));
    });

    req.pipe(proxyReq);
    return;
  }

  const requestedPath = decodeURIComponent(url.pathname);
  let filePath = path.join(root, requestedPath === '/' ? 'index.html' : requestedPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html');
  }

  sendFile(res, filePath);
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend running at http://localhost:${port}`);
});
