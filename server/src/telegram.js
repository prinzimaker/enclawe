// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/telegram.js
// Telegram integration - Bot API communication
// ------------------------------------------------------------

const config = require('./config');

// Telegram API base URL
const API_BASE = 'https://api.telegram.org';

/**
 * Make a request to Telegram Bot API
 * @param {string} method - API method
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} API response
 */
async function apiRequest(method, params = {}) {
  if (!config.telegram.botToken) {
    console.warn('Telegram bot token not configured');
    return { ok: false, error: 'Bot token not configured' };
  }

  const url = `${API_BASE}/bot${config.telegram.botToken}/${method}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!data.ok) {
      console.error(`Telegram API error: ${method}`, data.description);
    }

    return data;
  } catch (err) {
    console.error(`Telegram API request failed: ${method}`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send a message to Telegram
 * @param {string} roomId - Room ID
 * @param {string} payload - Encrypted payload
 * @returns {Promise<Object>} Result with success, messageId, chatId
 */
async function sendMessage(roomId, payload) {
  // Use single chat for all rooms (Option C from architecture)
  const chatId = config.telegram.chatId;

  if (!chatId) {
    console.warn('Telegram chat ID not configured, message not relayed');
    return { success: false, error: 'Chat ID not configured' };
  }

  // Format message with room ID for routing
  const messageText = JSON.stringify({
    r: roomId,
    p: payload
  });

  const result = await apiRequest('sendMessage', {
    chat_id: chatId,
    text: messageText,
    disable_notification: true
  });

  if (result.ok) {
    return {
      success: true,
      messageId: result.result.message_id,
      chatId: chatId
    };
  }

  return {
    success: false,
    error: result.description || result.error
  };
}

/**
 * Delete a message from Telegram
 * @param {string} chatId - Telegram chat ID
 * @param {string|number} messageId - Message ID to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteMessage(chatId, messageId) {
  if (!chatId || !messageId) {
    return false;
  }

  const result = await apiRequest('deleteMessage', {
    chat_id: chatId,
    message_id: messageId
  });

  return result.ok === true;
}

/**
 * Set up webhook for receiving messages
 * @param {string} webhookUrl - Webhook URL
 * @param {string} secretToken - Secret token for verification
 * @returns {Promise<boolean>} Success status
 */
async function setWebhook(webhookUrl, secretToken) {
  const result = await apiRequest('setWebhook', {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ['message']
  });

  if (result.ok) {
    console.log('Telegram webhook set successfully');
  }

  return result.ok === true;
}

/**
 * Delete webhook
 * @returns {Promise<boolean>} Success status
 */
async function deleteWebhook() {
  const result = await apiRequest('deleteWebhook');
  return result.ok === true;
}

/**
 * Get webhook info
 * @returns {Promise<Object>} Webhook info
 */
async function getWebhookInfo() {
  const result = await apiRequest('getWebhookInfo');
  return result.result || {};
}

/**
 * Get bot info
 * @returns {Promise<Object>} Bot info
 */
async function getMe() {
  const result = await apiRequest('getMe');
  return result.result || {};
}

/**
 * Verify webhook request
 * @param {string} secretToken - Token from request header
 * @returns {boolean} True if valid
 */
function verifyWebhook(secretToken) {
  if (!config.telegram.webhookSecret) {
    return true; // No secret configured, allow all (dev mode)
  }
  return secretToken === config.telegram.webhookSecret;
}

/**
 * Parse incoming webhook message
 * @param {Object} update - Telegram update object
 * @returns {Object|null} Parsed message or null
 */
function parseWebhookMessage(update) {
  if (!update.message || !update.message.text) {
    return null;
  }

  try {
    const data = JSON.parse(update.message.text);

    // Validate expected format
    if (!data.r || !data.p) {
      return null;
    }

    return {
      roomId: data.r,
      payload: data.p,
      messageId: update.message.message_id,
      chatId: update.message.chat.id,
      timestamp: update.message.date * 1000
    };
  } catch {
    // Not a valid Enclawe message
    return null;
  }
}

/**
 * Initialize Telegram integration
 * @returns {Promise<void>}
 */
async function init() {
  if (!config.telegram.botToken) {
    console.warn('Telegram bot token not configured, skipping initialization');
    return;
  }

  // Get bot info
  const botInfo = await getMe();
  if (botInfo.username) {
    console.log(`Telegram bot initialized: @${botInfo.username}`);
  }

  // Set up webhook if URL is configured
  if (config.telegram.webhookUrl) {
    await setWebhook(config.telegram.webhookUrl, config.telegram.webhookSecret);
  }
}

module.exports = {
  init,
  sendMessage,
  deleteMessage,
  setWebhook,
  deleteWebhook,
  getWebhookInfo,
  getMe,
  verifyWebhook,
  parseWebhookMessage
};
