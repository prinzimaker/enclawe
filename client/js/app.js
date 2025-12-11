// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: client/js/app.js
// Main application - Ties together modules and manages state
// ------------------------------------------------------------

const EnclaweApp = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    wsUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
    translateUrl: '/api/translate'
  };

  // Application state
  const state = {
    roomId: null,
    roomKey: null,
    cryptoKey: null,
    identity: null,
    language: null,
    participants: [],
    wsClient: null,
    isCreator: false
  };

  // DOM Elements
  const elements = {};

  /**
   * Initialize the application
   */
  function init() {
    cacheElements();
    setupEventListeners();
    detectLanguage();
    restoreSession();

    // Configure translation service
    EnclaweTranslate.configure({ apiUrl: CONFIG.translateUrl });
  }

  /**
   * Cache DOM elements for quick access
   */
  function cacheElements() {
    // Screens
    elements.landingScreen = document.getElementById('landing-screen');
    elements.joinScreen = document.getElementById('join-screen');
    elements.createScreen = document.getElementById('create-screen');
    elements.shareScreen = document.getElementById('share-screen');
    elements.chatScreen = document.getElementById('chat-screen');

    // Landing buttons
    elements.btnCreateRoom = document.getElementById('btn-create-room');
    elements.btnJoinRoom = document.getElementById('btn-join-room');

    // Join form
    elements.btnBackJoin = document.getElementById('btn-back-join');
    elements.joinForm = document.getElementById('join-form');
    elements.joinRoomId = document.getElementById('join-room-id');
    elements.joinRoomKey = document.getElementById('join-room-key');
    elements.joinLanguage = document.getElementById('join-language');

    // Create form
    elements.btnBackCreate = document.getElementById('btn-back-create');
    elements.createForm = document.getElementById('create-form');
    elements.createLanguage = document.getElementById('create-language');

    // Share screen
    elements.shareRoomId = document.getElementById('share-room-id');
    elements.shareRoomKey = document.getElementById('share-room-key');
    elements.btnCopyRoomId = document.getElementById('btn-copy-room-id');
    elements.btnCopyRoomKey = document.getElementById('btn-copy-room-key');
    elements.btnCopyAll = document.getElementById('btn-copy-all');
    elements.btnEnterRoom = document.getElementById('btn-enter-room');

    // Chat screen
    elements.chatRoomId = document.getElementById('chat-room-id');
    elements.connectionStatus = document.getElementById('connection-status');
    elements.btnLeaveRoom = document.getElementById('btn-leave-room');
    elements.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    elements.btnRoomInfo = document.getElementById('btn-room-info');
    elements.sidebar = document.getElementById('sidebar');
    elements.participantsList = document.getElementById('participants-list');
    elements.myIdentity = document.getElementById('my-identity');
    elements.messagesContainer = document.getElementById('messages');
    elements.messageForm = document.getElementById('message-form');
    elements.messageInput = document.getElementById('message-input');

    // Modal
    elements.roomInfoModal = document.getElementById('room-info-modal');
    elements.modalRoomId = document.getElementById('modal-room-id');
    elements.modalRoomKey = document.getElementById('modal-room-key');
    elements.btnModalCopy = document.getElementById('btn-modal-copy');
    elements.modalClose = elements.roomInfoModal.querySelector('.modal-close');
    elements.modalOverlay = elements.roomInfoModal.querySelector('.modal-overlay');
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Landing screen
    elements.btnCreateRoom.addEventListener('click', () => showScreen('create'));
    elements.btnJoinRoom.addEventListener('click', () => showScreen('join'));

    // Join screen
    elements.btnBackJoin.addEventListener('click', () => showScreen('landing'));
    elements.joinForm.addEventListener('submit', handleJoinRoom);
    elements.joinRoomId.addEventListener('input', formatRoomIdInput);

    // Create screen
    elements.btnBackCreate.addEventListener('click', () => showScreen('landing'));
    elements.createForm.addEventListener('submit', handleCreateRoom);

    // Share screen
    elements.btnCopyRoomId.addEventListener('click', () => copyToClipboard(state.roomId));
    elements.btnCopyRoomKey.addEventListener('click', () => copyToClipboard(state.roomKey));
    elements.btnCopyAll.addEventListener('click', copyAllDetails);
    elements.btnEnterRoom.addEventListener('click', enterRoom);

    // Chat screen
    elements.btnLeaveRoom.addEventListener('click', leaveRoom);
    elements.btnToggleSidebar.addEventListener('click', toggleSidebar);
    elements.btnRoomInfo.addEventListener('click', showRoomInfo);
    elements.messageForm.addEventListener('submit', handleSendMessage);

    // Modal
    elements.modalClose.addEventListener('click', hideRoomInfo);
    elements.modalOverlay.addEventListener('click', hideRoomInfo);
    elements.btnModalCopy.addEventListener('click', copyAllDetails);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
  }

  /**
   * Detect user's preferred language
   */
  function detectLanguage() {
    const lang = EnclaweTranslate.detectBrowserLanguage();
    elements.joinLanguage.value = lang;
    elements.createLanguage.value = lang;
  }

  /**
   * Restore session from storage
   */
  function restoreSession() {
    const savedSession = sessionStorage.getItem('enclawe_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.roomId && session.roomKey && session.identity) {
          state.roomId = session.roomId;
          state.roomKey = session.roomKey;
          state.identity = session.identity;
          state.language = session.language;
          // Don't auto-reconnect, just show chat if desired
        }
      } catch (e) {
        sessionStorage.removeItem('enclawe_session');
      }
    }
  }

  /**
   * Save session to storage
   */
  function saveSession() {
    const session = {
      roomId: state.roomId,
      roomKey: state.roomKey,
      identity: state.identity,
      language: state.language
    };
    sessionStorage.setItem('enclawe_session', JSON.stringify(session));
  }

  /**
   * Clear session from storage
   */
  function clearSession() {
    sessionStorage.removeItem('enclawe_session');
  }

  /**
   * Show a specific screen
   * @param {string} screenName - Screen to show
   */
  function showScreen(screenName) {
    const screens = ['landing', 'join', 'create', 'share', 'chat'];
    screens.forEach(name => {
      const screen = elements[`${name}Screen`];
      if (screen) {
        screen.classList.toggle('hidden', name !== screenName);
      }
    });
  }

  /**
   * Format room ID input to uppercase
   * @param {Event} e - Input event
   */
  function formatRoomIdInput(e) {
    e.target.value = e.target.value.toUpperCase();
  }

  /**
   * Handle create room form submission
   * @param {Event} e - Submit event
   */
  async function handleCreateRoom(e) {
    e.preventDefault();

    EnclaweUI.showLoading(true, 'Creating room...');

    try {
      // Generate room credentials
      state.roomId = EnclaweIdentity.generateRoomId();
      state.roomKey = EnclaweСrypto.generateKey();
      state.language = elements.createLanguage.value;
      state.isCreator = true;

      // Show share screen
      elements.shareRoomId.textContent = state.roomId;
      elements.shareRoomKey.textContent = state.roomKey;

      EnclaweUI.showLoading(false);
      showScreen('share');
    } catch (error) {
      console.error('Error creating room:', error);
      EnclaweUI.showLoading(false);
      EnclaweUI.showNotification('Failed to create room', 'error');
    }
  }

  /**
   * Handle join room form submission
   * @param {Event} e - Submit event
   */
  async function handleJoinRoom(e) {
    e.preventDefault();

    const roomId = elements.joinRoomId.value.toUpperCase().trim();
    const roomKey = elements.joinRoomKey.value.trim();
    const language = elements.joinLanguage.value;

    // Validate room ID format
    if (!EnclaweIdentity.isValidRoomId(roomId)) {
      EnclaweUI.showNotification('Invalid room ID format', 'error');
      return;
    }

    // Validate key
    if (!EnclaweСrypto.isValidKey(roomKey)) {
      EnclaweUI.showNotification('Invalid encryption key', 'error');
      return;
    }

    state.roomId = roomId;
    state.roomKey = roomKey;
    state.language = language;
    state.isCreator = false;

    enterRoom();
  }

  /**
   * Enter the chat room
   */
  async function enterRoom() {
    EnclaweUI.showLoading(true, 'Connecting...');

    try {
      // Import encryption key
      state.cryptoKey = await EnclaweСrypto.importKey(state.roomKey);

      // Connect to WebSocket
      await connectWebSocket();

      // Update UI
      elements.chatRoomId.textContent = state.roomId;
      elements.modalRoomId.textContent = state.roomId;
      elements.modalRoomKey.textContent = state.roomKey;

      EnclaweUI.showLoading(false);
      showScreen('chat');

      // Focus message input
      elements.messageInput.focus();
    } catch (error) {
      console.error('Error entering room:', error);
      EnclaweUI.showLoading(false);
      EnclaweUI.showNotification('Failed to connect to room', 'error');
    }
  }

  /**
   * Connect to WebSocket server
   */
  async function connectWebSocket() {
    state.wsClient = EnclaweWebSocket.createClient(CONFIG.wsUrl);

    // Set up event handlers
    state.wsClient.on('stateChange', handleConnectionStateChange);
    state.wsClient.on('joined', handleJoined);
    state.wsClient.on('message', handleMessage);
    state.wsClient.on('user_joined', handleUserJoined);
    state.wsClient.on('user_left', handleUserLeft);
    state.wsClient.on('error', handleError);

    // Connect
    await state.wsClient.connect();

    // Join room
    state.wsClient.joinRoom(state.roomId, state.identity || 'pending', state.language);
  }

  /**
   * Handle connection state changes
   * @param {Object} data - State change data
   */
  function handleConnectionStateChange({ newState }) {
    const statusClasses = {
      connected: 'connection-connected',
      connecting: 'connection-connecting',
      disconnected: 'connection-disconnected',
      reconnecting: 'connection-reconnecting'
    };

    elements.connectionStatus.className = `connection-status ${statusClasses[newState] || ''}`;
    elements.connectionStatus.title = newState.charAt(0).toUpperCase() + newState.slice(1);

    if (newState === 'disconnected') {
      EnclaweUI.showNotification('Disconnected from server', 'warning');
    } else if (newState === 'connected' && state.identity) {
      EnclaweUI.showNotification('Connected', 'success');
    }
  }

  /**
   * Handle joined confirmation
   * @param {Object} data - Joined data
   */
  function handleJoined(data) {
    state.identity = data.identity;
    state.participants = data.participants || [];

    // Add self to participants
    if (!state.participants.includes(state.identity)) {
      state.participants.push(state.identity);
    }

    elements.myIdentity.textContent = state.identity;
    updateParticipantsList();
    saveSession();

    // Show system message
    addSystemMessage(`You joined as ${state.identity}`);
  }

  /**
   * Handle incoming message
   * @param {Object} data - Message data
   */
  async function handleMessage(data) {
    if (data.type !== 'message' || !data.payload) return;

    try {
      // Decrypt message
      const message = await EnclaweСrypto.decryptMessage(data.payload, state.cryptoKey);

      // Translate if needed
      if (message.lang !== state.language) {
        const translated = await EnclaweTranslate.translateMessage(message, state.language);
        message.translatedText = translated.translatedText;
      }

      // Add message ID for tracking
      message.id = data.messageId;

      // Display message
      const isOwn = message.sender === state.identity;
      const messageEl = EnclaweUI.createMessageElement(message, isOwn);
      EnclaweUI.addMessage(elements.messagesContainer, messageEl);

      // Send ACK
      if (data.messageId) {
        state.wsClient.sendAck(state.roomId, data.messageId);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Could be wrong key - show error
      addSystemMessage('Failed to decrypt message. Wrong key?', 'error');
    }
  }

  /**
   * Handle user joined event
   * @param {Object} data - User joined data
   */
  function handleUserJoined(data) {
    if (!state.participants.includes(data.identity)) {
      state.participants.push(data.identity);
      updateParticipantsList();
    }
    addSystemMessage(`${data.identity} joined`);
  }

  /**
   * Handle user left event
   * @param {Object} data - User left data
   */
  function handleUserLeft(data) {
    state.participants = state.participants.filter(p => p !== data.identity);
    updateParticipantsList();
    addSystemMessage(`${data.identity} left`);
  }

  /**
   * Handle WebSocket error
   * @param {Error} error - Error object
   */
  function handleError(error) {
    console.error('WebSocket error:', error);
    EnclaweUI.showNotification('Connection error', 'error');
  }

  /**
   * Handle send message form submission
   * @param {Event} e - Submit event
   */
  async function handleSendMessage(e) {
    e.preventDefault();

    const text = elements.messageInput.value.trim();
    if (!text) return;

    try {
      // Create message object
      const message = {
        sender: state.identity,
        lang: state.language,
        text: text,
        ts: Date.now()
      };

      // Encrypt message
      const payload = await EnclaweСrypto.encryptMessage(message, state.cryptoKey);

      // Send via WebSocket
      state.wsClient.sendMessage(state.roomId, payload);

      // Clear input
      elements.messageInput.value = '';
      elements.messageInput.focus();

      // Display own message immediately
      const messageEl = EnclaweUI.createMessageElement(message, true);
      EnclaweUI.addMessage(elements.messagesContainer, messageEl);
    } catch (error) {
      console.error('Error sending message:', error);
      EnclaweUI.showNotification('Failed to send message', 'error');
    }
  }

  /**
   * Leave the current room
   */
  function leaveRoom() {
    if (state.wsClient) {
      state.wsClient.leaveRoom(state.roomId);
      state.wsClient.disconnect();
    }

    // Clear state
    state.roomId = null;
    state.roomKey = null;
    state.cryptoKey = null;
    state.identity = null;
    state.participants = [];
    state.wsClient = null;
    state.isCreator = false;

    clearSession();

    // Clear UI
    elements.messagesContainer.innerHTML = '';
    elements.participantsList.innerHTML = '';

    showScreen('landing');
  }

  /**
   * Toggle sidebar visibility
   */
  function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
  }

  /**
   * Show room info modal
   */
  function showRoomInfo() {
    elements.roomInfoModal.classList.remove('hidden');
  }

  /**
   * Hide room info modal
   */
  function hideRoomInfo() {
    elements.roomInfoModal.classList.add('hidden');
  }

  /**
   * Update participants list in UI
   */
  function updateParticipantsList() {
    EnclaweUI.updateParticipants(
      elements.participantsList,
      state.participants,
      state.identity
    );
  }

  /**
   * Add system message to chat
   * @param {string} text - Message text
   * @param {string} type - Message type
   */
  function addSystemMessage(text, type = 'info') {
    const messageEl = EnclaweUI.createSystemMessage(text, type);
    EnclaweUI.addMessage(elements.messagesContainer, messageEl);
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   */
  async function copyToClipboard(text) {
    await EnclaweUI.copyToClipboard(text);
  }

  /**
   * Copy all room details to clipboard
   */
  async function copyAllDetails() {
    const details = `Enclawe Room
Room ID: ${state.roomId}
Key: ${state.roomKey}

Join at: ${window.location.origin}`;

    await EnclaweUI.copyToClipboard(details);
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyboard(e) {
    // Escape to close modal
    if (e.key === 'Escape') {
      hideRoomInfo();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API (for debugging)
  return {
    getState: () => ({ ...state }),
    CONFIG
  };
})();
