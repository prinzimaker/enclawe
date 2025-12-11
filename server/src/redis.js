// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: server/src/redis.js
// Redis module - Connections, pub/sub, and data operations
// ------------------------------------------------------------

const Redis = require('ioredis');
const config = require('./config');

// Redis clients
let client = null;      // For commands
let subscriber = null;  // For pub/sub subscriptions
let publisher = null;   // For pub/sub publishing

// Subscription handlers
const subscriptionHandlers = new Map();

/**
 * Initialize Redis connections
 * @returns {Promise<void>}
 */
async function init() {
  const options = {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3
  };

  // Create main client
  client = new Redis(config.redis.url, options);

  // Create pub/sub clients
  subscriber = new Redis(config.redis.url, options);
  publisher = new Redis(config.redis.url, options);

  // Set up event handlers
  client.on('connect', () => console.log('Redis client connected'));
  client.on('error', (err) => console.error('Redis client error:', err));

  subscriber.on('connect', () => console.log('Redis subscriber connected'));
  subscriber.on('error', (err) => console.error('Redis subscriber error:', err));
  subscriber.on('message', handleMessage);

  publisher.on('connect', () => console.log('Redis publisher connected'));
  publisher.on('error', (err) => console.error('Redis publisher error:', err));

  // Wait for connections
  await Promise.all([
    new Promise((resolve) => client.once('ready', resolve)),
    new Promise((resolve) => subscriber.once('ready', resolve)),
    new Promise((resolve) => publisher.once('ready', resolve))
  ]);

  console.log('Redis initialized');
}

/**
 * Get prefixed key
 * @param {string} key - Key without prefix
 * @returns {string} Prefixed key
 */
function getKey(key) {
  return `${config.redis.keyPrefix}${key}`;
}

/**
 * Handle incoming pub/sub message
 * @param {string} channel - Channel name
 * @param {string} message - Message content
 */
function handleMessage(channel, message) {
  const handlers = subscriptionHandlers.get(channel) || [];
  let parsed;

  try {
    parsed = JSON.parse(message);
  } catch {
    parsed = message;
  }

  handlers.forEach(handler => {
    try {
      handler(parsed, channel);
    } catch (err) {
      console.error(`Error in subscription handler for ${channel}:`, err);
    }
  });
}

/**
 * Subscribe to a channel
 * @param {string} channel - Channel name
 * @param {Function} handler - Message handler
 * @returns {Promise<void>}
 */
async function subscribe(channel, handler) {
  const prefixedChannel = getKey(channel);

  if (!subscriptionHandlers.has(prefixedChannel)) {
    subscriptionHandlers.set(prefixedChannel, []);
    await subscriber.subscribe(prefixedChannel);
  }

  subscriptionHandlers.get(prefixedChannel).push(handler);
}

/**
 * Unsubscribe from a channel
 * @param {string} channel - Channel name
 * @param {Function} handler - Handler to remove (optional, removes all if not provided)
 * @returns {Promise<void>}
 */
async function unsubscribe(channel, handler = null) {
  const prefixedChannel = getKey(channel);

  if (!subscriptionHandlers.has(prefixedChannel)) return;

  if (handler) {
    const handlers = subscriptionHandlers.get(prefixedChannel);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      subscriptionHandlers.delete(prefixedChannel);
      await subscriber.unsubscribe(prefixedChannel);
    }
  } else {
    subscriptionHandlers.delete(prefixedChannel);
    await subscriber.unsubscribe(prefixedChannel);
  }
}

/**
 * Publish message to a channel
 * @param {string} channel - Channel name
 * @param {*} message - Message to publish
 * @returns {Promise<number>} Number of subscribers that received the message
 */
async function publish(channel, message) {
  const prefixedChannel = getKey(channel);
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  return publisher.publish(prefixedChannel, data);
}

// ============================================
// Key-Value Operations
// ============================================

/**
 * Set a key-value pair
 * @param {string} key - Key
 * @param {*} value - Value (will be stringified if object)
 * @param {number} ttl - TTL in seconds (optional)
 * @returns {Promise<string>}
 */
async function set(key, value, ttl = null) {
  const prefixedKey = getKey(key);
  const data = typeof value === 'string' ? value : JSON.stringify(value);

  if (ttl) {
    return client.setex(prefixedKey, ttl, data);
  }
  return client.set(prefixedKey, data);
}

/**
 * Get a value by key
 * @param {string} key - Key
 * @param {boolean} parse - Whether to parse JSON (default: true)
 * @returns {Promise<*>}
 */
async function get(key, parse = true) {
  const prefixedKey = getKey(key);
  const value = await client.get(prefixedKey);

  if (value === null) return null;
  if (!parse) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Delete a key
 * @param {string} key - Key
 * @returns {Promise<number>}
 */
async function del(key) {
  const prefixedKey = getKey(key);
  return client.del(prefixedKey);
}

/**
 * Check if key exists
 * @param {string} key - Key
 * @returns {Promise<boolean>}
 */
async function exists(key) {
  const prefixedKey = getKey(key);
  const result = await client.exists(prefixedKey);
  return result === 1;
}

/**
 * Set TTL on a key
 * @param {string} key - Key
 * @param {number} seconds - TTL in seconds
 * @returns {Promise<number>}
 */
async function expire(key, seconds) {
  const prefixedKey = getKey(key);
  return client.expire(prefixedKey, seconds);
}

// ============================================
// Hash Operations
// ============================================

/**
 * Set a hash field
 * @param {string} key - Hash key
 * @param {string} field - Field name
 * @param {*} value - Value
 * @returns {Promise<number>}
 */
async function hset(key, field, value) {
  const prefixedKey = getKey(key);
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  return client.hset(prefixedKey, field, data);
}

/**
 * Get a hash field
 * @param {string} key - Hash key
 * @param {string} field - Field name
 * @param {boolean} parse - Whether to parse JSON
 * @returns {Promise<*>}
 */
async function hget(key, field, parse = true) {
  const prefixedKey = getKey(key);
  const value = await client.hget(prefixedKey, field);

  if (value === null) return null;
  if (!parse) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Get all hash fields and values
 * @param {string} key - Hash key
 * @param {boolean} parse - Whether to parse JSON values
 * @returns {Promise<Object>}
 */
async function hgetall(key, parse = true) {
  const prefixedKey = getKey(key);
  const data = await client.hgetall(prefixedKey);

  if (!parse) return data;

  const result = {};
  for (const [field, value] of Object.entries(data)) {
    try {
      result[field] = JSON.parse(value);
    } catch {
      result[field] = value;
    }
  }
  return result;
}

/**
 * Delete hash fields
 * @param {string} key - Hash key
 * @param {...string} fields - Fields to delete
 * @returns {Promise<number>}
 */
async function hdel(key, ...fields) {
  const prefixedKey = getKey(key);
  return client.hdel(prefixedKey, ...fields);
}

// ============================================
// Set Operations
// ============================================

/**
 * Add members to a set
 * @param {string} key - Set key
 * @param {...string} members - Members to add
 * @returns {Promise<number>}
 */
async function sadd(key, ...members) {
  const prefixedKey = getKey(key);
  return client.sadd(prefixedKey, ...members);
}

/**
 * Remove members from a set
 * @param {string} key - Set key
 * @param {...string} members - Members to remove
 * @returns {Promise<number>}
 */
async function srem(key, ...members) {
  const prefixedKey = getKey(key);
  return client.srem(prefixedKey, ...members);
}

/**
 * Get all members of a set
 * @param {string} key - Set key
 * @returns {Promise<string[]>}
 */
async function smembers(key) {
  const prefixedKey = getKey(key);
  return client.smembers(prefixedKey);
}

/**
 * Check if member exists in set
 * @param {string} key - Set key
 * @param {string} member - Member to check
 * @returns {Promise<boolean>}
 */
async function sismember(key, member) {
  const prefixedKey = getKey(key);
  const result = await client.sismember(prefixedKey, member);
  return result === 1;
}

/**
 * Get set size
 * @param {string} key - Set key
 * @returns {Promise<number>}
 */
async function scard(key) {
  const prefixedKey = getKey(key);
  return client.scard(prefixedKey);
}

// ============================================
// Cleanup
// ============================================

/**
 * Close all Redis connections
 * @returns {Promise<void>}
 */
async function close() {
  await Promise.all([
    client?.quit(),
    subscriber?.quit(),
    publisher?.quit()
  ]);
  console.log('Redis connections closed');
}

/**
 * Get Redis client for direct operations
 * @returns {Redis}
 */
function getClient() {
  return client;
}

module.exports = {
  init,
  close,
  getClient,
  // Pub/Sub
  subscribe,
  unsubscribe,
  publish,
  // Key-Value
  set,
  get,
  del,
  exists,
  expire,
  // Hash
  hset,
  hget,
  hgetall,
  hdel,
  // Set
  sadd,
  srem,
  smembers,
  sismember,
  scard
};
