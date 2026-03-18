const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

// Run prisma db push on startup
try {
  console.log('> Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    timeout: 30000 
  });
  console.log('> Database tables created successfully');
} catch (err) {
  console.log('> Warning: prisma db push failed (tables may already exist):', err.message);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Waves Reporting Platform running on http://${hostname}:${port}`);
    });
});
