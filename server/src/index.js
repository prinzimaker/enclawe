// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/index.js
// Server entry point - Main application bootstrap
// ------------------------------------------------------------

const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const redis = require('./redis');
const websocket = require('./websocket');
const telegram = require('./telegram');
const webhookRouter = require('./webhook');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy for correct IP detection behind load balancer
app.set('trust proxy', true);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    server: websocket.SERVER_ID,
    connections: websocket.getClientsCount(),
    rooms: websocket.getRoomsCount()
  });
});

// Webhook routes
app.use('/webhook', webhookRouter);

// Translation proxy (for client-side translation)
app.post('/api/translate', async (req, res) => {
  if (!config.translate.enabled) {
    return res.status(503).json({ error: 'Translation service disabled' });
  }

  try {
    const response = await fetch(`${config.translate.url}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Translation proxy error:', err);
    res.status(502).json({ error: 'Translation service unavailable' });
  }
});

// Serve static files in production
if (config.isProd()) {
  const staticPath = path.join(__dirname, '../../client');
  app.use(express.static(staticPath));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Create HTTP server
const server = http.createServer(app);

/**
 * Start the server
 */
async function start() {
  try {
    // Validate configuration
    config.validate();

    // Initialize Redis
    console.log('Connecting to Redis...');
    await redis.init();

    // Initialize Telegram
    console.log('Initializing Telegram...');
    await telegram.init();

    // Initialize WebSocket server
    console.log('Initializing WebSocket server...');
    websocket.init(server);

    // Start HTTP server
    server.listen(config.port, config.host, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('  EnclaWe Server Started');
      console.log('='.repeat(50));
      console.log(`  Environment: ${config.env}`);
      console.log(`  Listening:   http://${config.host}:${config.port}`);
      console.log(`  WebSocket:   ws://${config.host}:${config.port}${config.websocket.path}`);
      console.log(`  Server ID:   ${websocket.SERVER_ID}`);
      console.log('='.repeat(50));
      console.log('');
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\nShutting down...');

  try {
    // Close WebSocket server
    websocket.close();

    // Close Redis connections
    await redis.close();

    // Close HTTP server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 10000);

  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
start();
