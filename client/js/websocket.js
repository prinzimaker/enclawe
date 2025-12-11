// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: client/js/websocket.js
// WebSocket module - Connection and message protocol
// ------------------------------------------------------------

const EnclaweWebSocket = (function() {
  'use strict';

  // Connection states
  const STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting'
  };

  // Default configuration
  const DEFAULT_CONFIG = {
    reconnectInterval: 1000,
    reconnectMaxInterval: 30000,
    reconnectMultiplier: 1.5,
    pingInterval: 30000,
    pongTimeout: 10000
  };

  /**
   * Create a new WebSocket client
   * @param {string} url - WebSocket server URL
   * @param {Object} options - Configuration options
   * @returns {Object} WebSocket client instance
   */
  function createClient(url, options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };

    let ws = null;
    let state = STATE.DISCONNECTED;
    let reconnectAttempts = 0;
    let reconnectTimeout = null;
    let pingInterval = null;
    let pongTimeout = null;

    // Event handlers
    const handlers = {
      open: [],
      close: [],
      error: [],
      message: [],
      joined: [],
      user_joined: [],
      user_left: [],
      stateChange: []
    };

    /**
     * Register event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    function on(event, handler) {
      if (handlers[event]) {
        handlers[event].push(handler);
      }
    }

    /**
     * Remove event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    function off(event, handler) {
      if (handlers[event]) {
        handlers[event] = handlers[event].filter(h => h !== handler);
      }
    }

    /**
     * Emit event to all handlers
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    function emit(event, data) {
      if (handlers[event]) {
        handlers[event].forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            console.error(`Error in ${event} handler:`, err);
          }
        });
      }
    }

    /**
     * Update connection state
     * @param {string} newState - New state
     */
    function setState(newState) {
      if (state !== newState) {
        const oldState = state;
        state = newState;
        emit('stateChange', { oldState, newState });
      }
    }

    /**
     * Start ping interval
     */
    function startPing() {
      stopPing();
      pingInterval = setInterval(() => {
        if (state === STATE.CONNECTED) {
          send({ type: 'ping' });

          // Set pong timeout
          pongTimeout = setTimeout(() => {
            console.warn('Pong timeout, reconnecting...');
            reconnect();
          }, config.pongTimeout);
        }
      }, config.pingInterval);
    }

    /**
     * Stop ping interval
     */
    function stopPing() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (pongTimeout) {
        clearTimeout(pongTimeout);
        pongTimeout = null;
      }
    }

    /**
     * Handle incoming message
     * @param {MessageEvent} event - WebSocket message event
     */
    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);

        // Handle pong
        if (data.type === 'pong') {
          if (pongTimeout) {
            clearTimeout(pongTimeout);
            pongTimeout = null;
          }
          return;
        }

        // Emit specific event type
        if (data.type && handlers[data.type]) {
          emit(data.type, data);
        }

        // Always emit generic message event
        emit('message', data);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    }

    /**
     * Connect to WebSocket server
     * @returns {Promise} Resolves when connected
     */
    function connect() {
      return new Promise((resolve, reject) => {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          resolve();
          return;
        }

        setState(STATE.CONNECTING);
        ws = new WebSocket(url);

        ws.onopen = () => {
          setState(STATE.CONNECTED);
          reconnectAttempts = 0;
          startPing();
          emit('open', {});
          resolve();
        };

        ws.onclose = (event) => {
          stopPing();
          setState(STATE.DISCONNECTED);
          emit('close', { code: event.code, reason: event.reason });

          // Auto-reconnect unless intentionally closed
          if (event.code !== 1000) {
            scheduleReconnect();
          }
        };

        ws.onerror = (error) => {
          emit('error', error);
          reject(error);
        };

        ws.onmessage = handleMessage;
      });
    }

    /**
     * Schedule reconnection attempt
     */
    function scheduleReconnect() {
      if (reconnectTimeout) return;

      setState(STATE.RECONNECTING);

      const delay = Math.min(
        config.reconnectInterval * Math.pow(config.reconnectMultiplier, reconnectAttempts),
        config.reconnectMaxInterval
      );

      reconnectAttempts++;

      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connect().catch(() => {
          // Will auto-schedule another reconnect
        });
      }, delay);
    }

    /**
     * Force reconnection
     */
    function reconnect() {
      disconnect();
      connect();
    }

    /**
     * Disconnect from server
     */
    function disconnect() {
      stopPing();

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (ws) {
        ws.close(1000, 'Client disconnect');
        ws = null;
      }

      setState(STATE.DISCONNECTED);
    }

    /**
     * Send message to server
     * @param {Object} data - Message data
     * @returns {boolean} True if sent successfully
     */
    function send(data) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('Cannot send: WebSocket not connected');
        return false;
      }

      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        return false;
      }
    }

    /**
     * Join a room
     * @param {string} room - Room ID
     * @param {string} identity - User identity
     * @param {string} lang - User's language code
     */
    function joinRoom(room, identity, lang) {
      return send({
        type: 'join',
        room,
        identity,
        lang
      });
    }

    /**
     * Leave a room
     * @param {string} room - Room ID
     */
    function leaveRoom(room) {
      return send({
        type: 'leave',
        room
      });
    }

    /**
     * Send a message to a room
     * @param {string} room - Room ID
     * @param {string} payload - Encrypted payload
     */
    function sendMessage(room, payload) {
      return send({
        type: 'message',
        room,
        payload
      });
    }

    /**
     * Acknowledge message receipt
     * @param {string} room - Room ID
     * @param {string} messageId - Message ID
     */
    function sendAck(room, messageId) {
      return send({
        type: 'ack',
        room,
        messageId
      });
    }

    /**
     * Get current connection state
     * @returns {string} Current state
     */
    function getState() {
      return state;
    }

    /**
     * Check if connected
     * @returns {boolean} True if connected
     */
    function isConnected() {
      return state === STATE.CONNECTED;
    }

    // Public API
    return {
      connect,
      disconnect,
      reconnect,
      send,
      joinRoom,
      leaveRoom,
      sendMessage,
      sendAck,
      on,
      off,
      getState,
      isConnected,
      STATE
    };
  }

  // Public API
  return {
    createClient,
    STATE
  };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnclaweWebSocket;
}
