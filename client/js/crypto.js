// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: client/js/crypto.js
// Crypto module - AES-256-GCM encryption using Web Crypto API
// ------------------------------------------------------------

const EnclaweСrypto = (function() {
  'use strict';

  /**
   * Generate a new 256-bit encryption key
   * @returns {string} Base64-encoded key
   */
  function generateKey() {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
    return btoa(String.fromCharCode(...keyBytes));
  }

  /**
   * Import a base64-encoded key for use with Web Crypto API
   * @param {string} keyBase64 - Base64-encoded key
   * @returns {Promise<CryptoKey>} Imported CryptoKey object
   */
  async function importKey(keyBase64) {
    const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * @param {string} plaintext - Text to encrypt
   * @param {CryptoKey} key - CryptoKey object
   * @returns {Promise<string>} Base64-encoded ciphertext (IV prepended)
   */
  async function encrypt(plaintext, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );

    // Prepend IV to ciphertext
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv);
    result.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...result));
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * @param {string} ciphertextBase64 - Base64-encoded ciphertext (IV prepended)
   * @param {CryptoKey} key - CryptoKey object
   * @returns {Promise<string>} Decrypted plaintext
   * @throws {Error} If decryption fails (wrong key or corrupted data)
   */
  async function decrypt(ciphertextBase64, key) {
    const data = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Encrypt a message object for transmission
   * @param {Object} message - Message object with sender, lang, text, ts
   * @param {CryptoKey} key - CryptoKey object
   * @returns {Promise<string>} Base64-encoded encrypted payload
   */
  async function encryptMessage(message, key) {
    const plaintext = JSON.stringify(message);
    return encrypt(plaintext, key);
  }

  /**
   * Decrypt a message payload
   * @param {string} payload - Base64-encoded encrypted payload
   * @param {CryptoKey} key - CryptoKey object
   * @returns {Promise<Object>} Decrypted message object
   */
  async function decryptMessage(payload, key) {
    const plaintext = await decrypt(payload, key);
    return JSON.parse(plaintext);
  }

  /**
   * Validate that a key is properly formatted
   * @param {string} keyBase64 - Base64-encoded key to validate
   * @returns {boolean} True if key is valid
   */
  function isValidKey(keyBase64) {
    try {
      const decoded = atob(keyBase64);
      return decoded.length === 32; // 256 bits = 32 bytes
    } catch {
      return false;
    }
  }

  // Public API
  return {
    generateKey,
    importKey,
    encrypt,
    decrypt,
    encryptMessage,
    decryptMessage,
    isValidKey
  };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnclaweСrypto;
}
