// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/webhook.js
// Webhook handler - Incoming webhooks from Telegram
// ------------------------------------------------------------

const express = require('express');
const telegram = require('./telegram');
const redis = require('./redis');
const room = require('./room');

const router = express.Router();

/**
 * Telegram webhook endpoint
 * POST /webhook/telegram
 */
router.post('/telegram', async (req, res) => {
  // Verify webhook secret
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  if (!telegram.verifyWebhook(secretToken)) {
    console.warn('Invalid webhook secret');
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Parse the update
  const update = req.body;
  const message = telegram.parseWebhookMessage(update);

  if (!message) {
    // Not a valid Enclawe message, ignore
    return res.status(200).json({ ok: true });
  }

  try {
    // Route message to room via Redis pub/sub
    await handleIncomingMessage(message);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error handling webhook:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * Handle incoming message from Telegram
 * @param {Object} message - Parsed message
 */
async function handleIncomingMessage(message) {
  const { roomId, payload, messageId, chatId, timestamp } = message;

  // Check if room exists
  const exists = await room.roomExists(roomId);
  if (!exists) {
    console.log(`Message for non-existent room: ${roomId}`);
    // Optionally delete the message from Telegram
    await telegram.deleteMessage(chatId, messageId);
    return;
  }

  // Generate internal message ID
  const internalMessageId = room.generateMessageId();

  // Track message for ACKs
  await room.trackMessage(roomId, internalMessageId, messageId, chatId);

  // Publish to room channel
  await redis.publish(`room:${roomId}`, {
    type: 'message',
    room: roomId,
    messageId: internalMessageId,
    payload,
    timestamp,
    sender: null // From Telegram, deliver to all
  });

  console.log(`Routed message to room ${roomId}`);
}

/**
 * Health check endpoint
 * GET /webhook/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

module.exports = router;
