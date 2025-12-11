// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/room.js
// Room management - Creation, joining, leaving, participants
// ------------------------------------------------------------

const { v4: uuidv4 } = require('uuid');
const redis = require('./redis');
const config = require('./config');

// Color and animal definitions for identity generation
const COLORS = [
  { emoji: '🔵', name: 'Blue' },
  { emoji: '🟢', name: 'Green' },
  { emoji: '🟣', name: 'Purple' },
  { emoji: '🟠', name: 'Orange' },
  { emoji: '🔴', name: 'Red' },
  { emoji: '🟡', name: 'Yellow' },
  { emoji: '⚪', name: 'White' },
  { emoji: '🟤', name: 'Brown' }
];

const ANIMALS = [
  'Fox', 'Wolf', 'Bear', 'Eagle', 'Owl',
  'Hawk', 'Deer', 'Lion', 'Tiger', 'Panther',
  'Raven', 'Falcon', 'Otter', 'Lynx', 'Badger'
];

// Redis key patterns
const KEYS = {
  roomUsers: (roomId) => `room:${roomId}:users`,
  roomTelegram: (roomId) => `room:${roomId}:telegram_chat_id`,
  roomExpires: (roomId) => `room:${roomId}:expires`,
  msgPending: (msgId) => `msg:${msgId}:pending`,
  msgTelegramId: (msgId) => `msg:${msgId}:telegram_id`,
  msgChatId: (msgId) => `msg:${msgId}:chat_id`
};

/**
 * Generate a unique identity for a user
 * @param {string[]} existingIdentities - Already used identities
 * @returns {string} Generated identity
 */
function generateIdentity(existingIdentities = []) {
  let identity;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    identity = `${color.emoji} ${color.name} ${animal}`;
    attempts++;
  } while (existingIdentities.includes(identity) && attempts < maxAttempts);

  return identity;
}

/**
 * Check if a room exists
 * @param {string} roomId - Room ID
 * @returns {Promise<boolean>}
 */
async function roomExists(roomId) {
  return redis.exists(KEYS.roomUsers(roomId));
}

/**
 * Create a new room
 * @param {string} roomId - Room ID
 * @param {string} telegramChatId - Telegram chat ID (optional)
 * @returns {Promise<boolean>} Success status
 */
async function createRoom(roomId, telegramChatId = null) {
  const key = KEYS.roomUsers(roomId);

  // Check if room already exists
  if (await redis.exists(key)) {
    return false;
  }

  // Initialize empty users hash
  await redis.hset(key, '__created__', Date.now().toString());

  // Store Telegram chat ID if provided
  if (telegramChatId) {
    await redis.set(KEYS.roomTelegram(roomId), telegramChatId);
  }

  console.log(`Room created: ${roomId}`);
  return true;
}

/**
 * Join a room
 * @param {string} roomId - Room ID
 * @param {string} connectionId - WebSocket connection ID
 * @param {string} serverId - Server instance ID
 * @param {string} preferredIdentity - Preferred identity (optional)
 * @returns {Promise<Object>} Join result with identity and participants
 */
async function joinRoom(roomId, connectionId, serverId, preferredIdentity = null) {
  const usersKey = KEYS.roomUsers(roomId);

  // Create room if it doesn't exist
  if (!(await redis.exists(usersKey))) {
    await createRoom(roomId);
  }

  // Get existing users
  const users = await redis.hgetall(usersKey, false);
  const existingIdentities = Object.keys(users).filter(k => k !== '__created__');

  // Generate or validate identity
  let identity = preferredIdentity;
  if (!identity || existingIdentities.includes(identity)) {
    identity = generateIdentity(existingIdentities);
  }

  // Add user to room
  const userData = {
    connectionId,
    serverId,
    joinedAt: Date.now()
  };
  await redis.hset(usersKey, identity, userData);

  // Clear any expiration on the room
  await redis.del(KEYS.roomExpires(roomId));

  console.log(`User ${identity} joined room ${roomId}`);

  return {
    identity,
    participants: existingIdentities
  };
}

/**
 * Leave a room
 * @param {string} roomId - Room ID
 * @param {string} identity - User identity
 * @returns {Promise<boolean>} Success status
 */
async function leaveRoom(roomId, identity) {
  const usersKey = KEYS.roomUsers(roomId);

  // Remove user
  await redis.hdel(usersKey, identity);

  // Check remaining users
  const users = await redis.hgetall(usersKey, false);
  const remainingUsers = Object.keys(users).filter(k => k !== '__created__');

  console.log(`User ${identity} left room ${roomId}, ${remainingUsers.length} remaining`);

  // If no users left, schedule room cleanup
  if (remainingUsers.length === 0) {
    await redis.set(KEYS.roomExpires(roomId), Date.now().toString(), 300); // 5 minutes TTL
  }

  return true;
}

/**
 * Get all participants in a room
 * @param {string} roomId - Room ID
 * @returns {Promise<string[]>} Array of identities
 */
async function getParticipants(roomId) {
  const users = await redis.hgetall(KEYS.roomUsers(roomId), false);
  return Object.keys(users).filter(k => k !== '__created__');
}

/**
 * Get participant info
 * @param {string} roomId - Room ID
 * @param {string} identity - User identity
 * @returns {Promise<Object|null>} User info or null
 */
async function getParticipant(roomId, identity) {
  return redis.hget(KEYS.roomUsers(roomId), identity);
}

/**
 * Get all participants with their connection info
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Map of identity -> connection info
 */
async function getParticipantsWithInfo(roomId) {
  const users = await redis.hgetall(KEYS.roomUsers(roomId));
  delete users.__created__;
  return users;
}

/**
 * Track message for ACK
 * @param {string} roomId - Room ID
 * @param {string} messageId - Message ID
 * @param {string} telegramMsgId - Telegram message ID
 * @param {string} telegramChatId - Telegram chat ID
 * @returns {Promise<void>}
 */
async function trackMessage(roomId, messageId, telegramMsgId, telegramChatId) {
  const participants = await getParticipants(roomId);

  // Store pending ACKs
  if (participants.length > 0) {
    await redis.sadd(KEYS.msgPending(messageId), ...participants);
  }

  // Store Telegram info for deletion
  await redis.set(KEYS.msgTelegramId(messageId), telegramMsgId, 60);
  await redis.set(KEYS.msgChatId(messageId), telegramChatId, 60);

  // Set TTL on pending set
  await redis.expire(KEYS.msgPending(messageId), 60);
}

/**
 * Acknowledge message receipt
 * @param {string} messageId - Message ID
 * @param {string} identity - User identity
 * @returns {Promise<Object>} Result with allAcked flag and Telegram info
 */
async function acknowledgeMessage(messageId, identity) {
  const pendingKey = KEYS.msgPending(messageId);

  // Remove from pending
  await redis.srem(pendingKey, identity);

  // Check if all ACKed
  const remaining = await redis.scard(pendingKey);
  const allAcked = remaining === 0;

  if (allAcked) {
    // Get Telegram info for deletion
    const telegramMsgId = await redis.get(KEYS.msgTelegramId(messageId), false);
    const telegramChatId = await redis.get(KEYS.msgChatId(messageId), false);

    // Cleanup
    await redis.del(KEYS.msgPending(messageId));
    await redis.del(KEYS.msgTelegramId(messageId));
    await redis.del(KEYS.msgChatId(messageId));

    return {
      allAcked: true,
      telegramMsgId,
      telegramChatId
    };
  }

  return { allAcked: false };
}

/**
 * Get Telegram chat ID for a room
 * @param {string} roomId - Room ID
 * @returns {Promise<string|null>}
 */
async function getTelegramChatId(roomId) {
  return redis.get(KEYS.roomTelegram(roomId), false);
}

/**
 * Set Telegram chat ID for a room
 * @param {string} roomId - Room ID
 * @param {string} chatId - Telegram chat ID
 * @returns {Promise<void>}
 */
async function setTelegramChatId(roomId, chatId) {
  await redis.set(KEYS.roomTelegram(roomId), chatId);
}

/**
 * Generate a unique message ID
 * @returns {string}
 */
function generateMessageId() {
  return `msg_${uuidv4()}`;
}

/**
 * Clean up expired rooms
 * @returns {Promise<number>} Number of rooms cleaned up
 */
async function cleanupExpiredRooms() {
  // This would need to scan for expired rooms
  // For now, Redis TTL handles cleanup
  return 0;
}

module.exports = {
  generateIdentity,
  roomExists,
  createRoom,
  joinRoom,
  leaveRoom,
  getParticipants,
  getParticipant,
  getParticipantsWithInfo,
  trackMessage,
  acknowledgeMessage,
  getTelegramChatId,
  setTelegramChatId,
  generateMessageId,
  cleanupExpiredRooms
};
