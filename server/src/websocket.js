// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/websocket.js
// WebSocket handler - Connections and message routing
// ------------------------------------------------------------

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const redis = require('./redis');
const room = require('./room');
const telegram = require('./telegram');
const config = require('./config');

// Server instance ID
const SERVER_ID = uuidv4();

// Connected clients map: connectionId -> { ws, roomId, identity }
const clients = new Map();

// Room subscriptions: roomId -> Set of connectionIds
const roomSubscriptions = new Map();

// WebSocket server instance
let wss = null;

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
function init(server) {
  wss = new WebSocket.Server({
    server,
    path: config.websocket.path
  });

  wss.on('connection', handleConnection);
  wss.on('error', (err) => console.error('WebSocket server error:', err));

  // Set up heartbeat interval
  setInterval(heartbeat, config.websocket.pingInterval);

  console.log(`WebSocket server initialized on path ${config.websocket.path}`);
}

/**
 * Handle new WebSocket connection
 * @param {WebSocket} ws - WebSocket client
 * @param {http.IncomingMessage} req - HTTP request
 */
function handleConnection(ws, req) {
  const connectionId = uuidv4();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`New connection: ${connectionId} from ${clientIp}`);

  // Store client
  clients.set(connectionId, {
    ws,
    roomId: null,
    identity: null,
    isAlive: true
  });

  // Set up event handlers
  ws.on('message', (data) => handleMessage(connectionId, data));
  ws.on('close', () => handleClose(connectionId));
  ws.on('error', (err) => handleError(connectionId, err));
  ws.on('pong', () => handlePong(connectionId));
}

/**
 * Handle incoming message from client
 * @param {string} connectionId - Connection ID
 * @param {Buffer|string} data - Message data
 */
async function handleMessage(connectionId, data) {
  const client = clients.get(connectionId);
  if (!client) return;

  let message;
  try {
    message = JSON.parse(data.toString());
  } catch (err) {
    sendError(client.ws, 'INVALID_JSON', 'Invalid JSON message');
    return;
  }

  // Handle message based on type
  switch (message.type) {
    case 'join':
      await handleJoin(connectionId, message);
      break;
    case 'leave':
      await handleLeave(connectionId, message);
      break;
    case 'message':
      await handleChatMessage(connectionId, message);
      break;
    case 'ack':
      await handleAck(connectionId, message);
      break;
    case 'ping':
      handlePing(connectionId);
      break;
    default:
      sendError(client.ws, 'UNKNOWN_TYPE', `Unknown message type: ${message.type}`);
  }
}

/**
 * Handle join room request
 * @param {string} connectionId - Connection ID
 * @param {Object} message - Join message
 */
async function handleJoin(connectionId, message) {
  const client = clients.get(connectionId);
  if (!client) return;

  const { room: roomId, identity: preferredIdentity, lang } = message;

  if (!roomId) {
    sendError(client.ws, 'MISSING_ROOM', 'Room ID is required');
    return;
  }

  try {
    // Join room
    const result = await room.joinRoom(roomId, connectionId, SERVER_ID, preferredIdentity);

    // Update client
    client.roomId = roomId;
    client.identity = result.identity;
    client.lang = lang;

    // Subscribe to room channel
    await subscribeToRoom(roomId, connectionId);

    // Send joined confirmation
    send(client.ws, {
      type: 'joined',
      room: roomId,
      identity: result.identity,
      participants: result.participants
    });

    // Broadcast user joined to room
    await broadcastToRoom(roomId, {
      type: 'user_joined',
      room: roomId,
      identity: result.identity
    }, connectionId);

  } catch (err) {
    console.error('Error joining room:', err);
    sendError(client.ws, 'JOIN_ERROR', 'Failed to join room');
  }
}

/**
 * Handle leave room request
 * @param {string} connectionId - Connection ID
 * @param {Object} message - Leave message
 */
async function handleLeave(connectionId, message) {
  const client = clients.get(connectionId);
  if (!client || !client.roomId) return;

  await leaveCurrentRoom(connectionId);
}

/**
 * Handle chat message
 * @param {string} connectionId - Connection ID
 * @param {Object} message - Chat message
 */
async function handleChatMessage(connectionId, message) {
  const client = clients.get(connectionId);
  if (!client || !client.roomId) {
    sendError(client?.ws, 'NOT_IN_ROOM', 'Must join a room first');
    return;
  }

  const { room: roomId, payload } = message;

  if (roomId !== client.roomId) {
    sendError(client.ws, 'WRONG_ROOM', 'Message room does not match joined room');
    return;
  }

  if (!payload) {
    sendError(client.ws, 'MISSING_PAYLOAD', 'Message payload is required');
    return;
  }

  try {
    // Generate message ID
    const messageId = room.generateMessageId();

    // Send to Telegram
    const telegramResult = await telegram.sendMessage(roomId, payload);

    if (telegramResult.success) {
      // Track message for ACKs
      await room.trackMessage(roomId, messageId, telegramResult.messageId, telegramResult.chatId);
    }

    // Broadcast to room via Redis (for multi-server support)
    await redis.publish(`room:${roomId}`, {
      type: 'message',
      room: roomId,
      messageId,
      payload,
      sender: connectionId // Exclude sender
    });

  } catch (err) {
    console.error('Error sending message:', err);
    sendError(client.ws, 'SEND_ERROR', 'Failed to send message');
  }
}

/**
 * Handle message acknowledgment
 * @param {string} connectionId - Connection ID
 * @param {Object} message - ACK message
 */
async function handleAck(connectionId, message) {
  const client = clients.get(connectionId);
  if (!client || !client.roomId) return;

  const { messageId } = message;
  if (!messageId) return;

  try {
    const result = await room.acknowledgeMessage(messageId, client.identity);

    // If all ACKed, delete from Telegram
    if (result.allAcked && result.telegramMsgId) {
      await telegram.deleteMessage(result.telegramChatId, result.telegramMsgId);
    }
  } catch (err) {
    console.error('Error processing ACK:', err);
  }
}

/**
 * Handle ping message
 * @param {string} connectionId - Connection ID
 */
function handlePing(connectionId) {
  const client = clients.get(connectionId);
  if (!client) return;

  send(client.ws, { type: 'pong' });
}

/**
 * Handle pong response
 * @param {string} connectionId - Connection ID
 */
function handlePong(connectionId) {
  const client = clients.get(connectionId);
  if (client) {
    client.isAlive = true;
  }
}

/**
 * Handle connection close
 * @param {string} connectionId - Connection ID
 */
async function handleClose(connectionId) {
  console.log(`Connection closed: ${connectionId}`);
  await leaveCurrentRoom(connectionId);
  clients.delete(connectionId);
}

/**
 * Handle connection error
 * @param {string} connectionId - Connection ID
 * @param {Error} err - Error object
 */
function handleError(connectionId, err) {
  console.error(`Connection error ${connectionId}:`, err.message);
}

/**
 * Leave current room
 * @param {string} connectionId - Connection ID
 */
async function leaveCurrentRoom(connectionId) {
  const client = clients.get(connectionId);
  if (!client || !client.roomId) return;

  const { roomId, identity } = client;

  try {
    // Leave room
    await room.leaveRoom(roomId, identity);

    // Unsubscribe from room
    await unsubscribeFromRoom(roomId, connectionId);

    // Broadcast user left
    await broadcastToRoom(roomId, {
      type: 'user_left',
      room: roomId,
      identity
    }, connectionId);

    // Update client
    client.roomId = null;
    client.identity = null;

  } catch (err) {
    console.error('Error leaving room:', err);
  }
}

/**
 * Subscribe to room messages
 * @param {string} roomId - Room ID
 * @param {string} connectionId - Connection ID
 */
async function subscribeToRoom(roomId, connectionId) {
  // Track local subscription
  if (!roomSubscriptions.has(roomId)) {
    roomSubscriptions.set(roomId, new Set());

    // Subscribe to Redis channel
    await redis.subscribe(`room:${roomId}`, (message) => {
      handleRoomMessage(roomId, message);
    });
  }

  roomSubscriptions.get(roomId).add(connectionId);
}

/**
 * Unsubscribe from room messages
 * @param {string} roomId - Room ID
 * @param {string} connectionId - Connection ID
 */
async function unsubscribeFromRoom(roomId, connectionId) {
  const subs = roomSubscriptions.get(roomId);
  if (!subs) return;

  subs.delete(connectionId);

  // If no more local subscribers, unsubscribe from Redis
  if (subs.size === 0) {
    roomSubscriptions.delete(roomId);
    await redis.unsubscribe(`room:${roomId}`);
  }
}

/**
 * Handle message from Redis pub/sub
 * @param {string} roomId - Room ID
 * @param {Object} message - Message data
 */
function handleRoomMessage(roomId, message) {
  const subs = roomSubscriptions.get(roomId);
  if (!subs) return;

  // Send to all subscribers except sender
  subs.forEach(connectionId => {
    if (message.sender === connectionId) return;

    const client = clients.get(connectionId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      send(client.ws, {
        type: message.type,
        room: roomId,
        messageId: message.messageId,
        payload: message.payload
      });
    }
  });
}

/**
 * Broadcast message to all clients in a room
 * @param {string} roomId - Room ID
 * @param {Object} message - Message to broadcast
 * @param {string} excludeConnectionId - Connection ID to exclude
 */
async function broadcastToRoom(roomId, message, excludeConnectionId = null) {
  // Publish to Redis for multi-server support
  await redis.publish(`room:${roomId}`, {
    ...message,
    sender: excludeConnectionId
  });
}

/**
 * Send message to WebSocket client
 * @param {WebSocket} ws - WebSocket client
 * @param {Object} message - Message to send
 */
function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Send error to WebSocket client
 * @param {WebSocket} ws - WebSocket client
 * @param {string} code - Error code
 * @param {string} message - Error message
 */
function sendError(ws, code, message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    send(ws, { type: 'error', code, message });
  }
}

/**
 * Heartbeat function to check client connections
 */
function heartbeat() {
  clients.forEach((client, connectionId) => {
    if (!client.isAlive) {
      console.log(`Connection timeout: ${connectionId}`);
      client.ws.terminate();
      return;
    }

    client.isAlive = false;
    client.ws.ping();
  });
}

/**
 * Get connected clients count
 * @returns {number}
 */
function getClientsCount() {
  return clients.size;
}

/**
 * Get room count
 * @returns {number}
 */
function getRoomsCount() {
  return roomSubscriptions.size;
}

/**
 * Close WebSocket server
 */
function close() {
  if (wss) {
    wss.close();
  }
}

module.exports = {
  init,
  close,
  getClientsCount,
  getRoomsCount,
  SERVER_ID
};
