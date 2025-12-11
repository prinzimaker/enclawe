// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: client/js/identity.js
// Identity module - User identity and room ID generation
// ------------------------------------------------------------

const EnclaweIdentity = (function() {
  'use strict';

  // Color definitions with emoji and name
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

  // Animal names for identity
  const ANIMALS = [
    'Fox', 'Wolf', 'Bear', 'Eagle', 'Owl',
    'Hawk', 'Deer', 'Lion', 'Tiger', 'Panther',
    'Raven', 'Falcon', 'Otter', 'Lynx', 'Badger'
  ];

  // Memorable words for room IDs
  const WORDS = [
    'METEOR', 'AURORA', 'NEBULA', 'COSMOS', 'PHOENIX',
    'THUNDER', 'CRYSTAL', 'SHADOW', 'SILVER', 'GOLDEN',
    'MYSTIC', 'ARCTIC', 'BLAZING', 'COSMIC', 'DIGITAL',
    'ECHO', 'FALCON', 'GLACIER', 'HARBOR', 'INFINITY',
    'JADE', 'KARMA', 'LUNAR', 'MARBLE', 'NEON',
    'ORBIT', 'PRISM', 'QUARTZ', 'RIPPLE', 'STORM'
  ];

  /**
   * Generate a random user identity
   * @param {string[]} existingIdentities - Array of identities already in use
   * @returns {string} Identity string like "🔵 Blue Fox"
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
   * Generate a random room ID
   * @returns {string} Room ID like "METEOR-7291"
   */
  function generateRoomId() {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const number = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${word}-${number}`;
  }

  /**
   * Validate room ID format
   * @param {string} roomId - Room ID to validate
   * @returns {boolean} True if valid format
   */
  function isValidRoomId(roomId) {
    const pattern = /^[A-Z]+-\d{4}$/;
    return pattern.test(roomId);
  }

  /**
   * Parse identity into components
   * @param {string} identity - Identity string
   * @returns {Object|null} Object with emoji, color, animal or null if invalid
   */
  function parseIdentity(identity) {
    const match = identity.match(/^(.+?)\s+(\w+)\s+(\w+)$/);
    if (!match) return null;

    return {
      emoji: match[1],
      color: match[2],
      animal: match[3]
    };
  }

  /**
   * Get color emoji from identity string
   * @param {string} identity - Identity string
   * @returns {string} Color emoji or empty string
   */
  function getColorEmoji(identity) {
    const parsed = parseIdentity(identity);
    return parsed ? parsed.emoji : '';
  }

  /**
   * Get available colors count
   * @returns {number} Number of available colors
   */
  function getColorsCount() {
    return COLORS.length;
  }

  /**
   * Get available animals count
   * @returns {number} Number of available animals
   */
  function getAnimalsCount() {
    return ANIMALS.length;
  }

  /**
   * Get maximum unique identities
   * @returns {number} Maximum number of unique identities
   */
  function getMaxIdentities() {
    return COLORS.length * ANIMALS.length;
  }

  // Public API
  return {
    generateIdentity,
    generateRoomId,
    isValidRoomId,
    parseIdentity,
    getColorEmoji,
    getColorsCount,
    getAnimalsCount,
    getMaxIdentities
  };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnclaweIdentity;
}
