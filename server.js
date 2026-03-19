const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

// Force production mode
process.env.NODE_ENV = 'production';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

let isReady = false;

console.log('> Preparing Next.js application...');

app.prepare().then(() => {
  isReady = true;
  console.log('> Next.js app prepared successfully');

  const server = createServer(async (req, res) => {
    try {
      // Fast health check that bypasses Next.js when not ready
      if (req.url === '/_health') {
        res.statusCode = isReady ? 200 : 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: isReady ? 'ready' : 'starting' }));
        return;
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  });

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, hostname, () => {
    console.log(`> Waves Reporting Platform running on http://${hostname}:${port}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`> ${signal} received, shutting down gracefully...`);
    isReady = false;
    server.close(() => {
      console.log('> Server closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

}).catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
