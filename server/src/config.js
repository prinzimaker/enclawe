// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/config.js
// Server configuration - Loads and validates environment variables
// ------------------------------------------------------------

require('dotenv').config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  host: process.env.HOST || '0.0.0.0',

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'enclawe:'
  },

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '' // Single chat for all rooms
  },

  // Translation
  translate: {
    url: process.env.TRANSLATE_URL || 'http://localhost:5000',
    enabled: process.env.TRANSLATE_ENABLED === 'true'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    joinRoom: { window: 60, max: 10 },      // 10 joins per minute
    sendMessage: { window: 1, max: 5 },      // 5 messages per second
    createRoom: { window: 3600, max: 5 }     // 5 rooms per hour
  },

  // WebSocket
  websocket: {
    path: '/ws',
    pingInterval: 30000,
    pingTimeout: 10000
  },

  // Room settings
  room: {
    maxParticipants: 50,
    inactivityTimeout: 3600000, // 1 hour
    messageTimeout: 30000 // 30 seconds before deleting from Telegram
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Validate required configuration
 */
function validate() {
  const errors = [];

  if (config.env === 'production') {
    if (!config.telegram.botToken) {
      errors.push('TELEGRAM_BOT_TOKEN is required in production');
    }
    if (!config.telegram.webhookSecret) {
      errors.push('TELEGRAM_WEBHOOK_SECRET is required in production');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

/**
 * Check if running in development mode
 * @returns {boolean}
 */
function isDev() {
  return config.env === 'development';
}

/**
 * Check if running in production mode
 * @returns {boolean}
 */
function isProd() {
  return config.env === 'production';
}

module.exports = {
  ...config,
  validate,
  isDev,
  isProd
};
