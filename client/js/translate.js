// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: client/js/translate.js
// Translation module - LibreTranslate integration
// ------------------------------------------------------------

const EnclaweTranslate = (function() {
  'use strict';

  // Supported languages
  const LANGUAGES = {
    en: { name: 'English', native: 'English' },
    es: { name: 'Spanish', native: 'Español' },
    fr: { name: 'French', native: 'Français' },
    de: { name: 'German', native: 'Deutsch' },
    it: { name: 'Italian', native: 'Italiano' },
    pt: { name: 'Portuguese', native: 'Português' },
    zh: { name: 'Chinese', native: '中文' },
    ja: { name: 'Japanese', native: '日本語' },
    ko: { name: 'Korean', native: '한국어' },
    ar: { name: 'Arabic', native: 'العربية' },
    ru: { name: 'Russian', native: 'Русский' },
    da: { name: 'Danish', native: 'Dansk' },
    nl: { name: 'Dutch', native: 'Nederlands' },
    pl: { name: 'Polish', native: 'Polski' }
  };

  // Default configuration
  let config = {
    apiUrl: '/api/translate',
    cacheEnabled: true,
    cacheMaxSize: 1000
  };

  // Translation cache
  const cache = new Map();

  /**
   * Configure the translation service
   * @param {Object} options - Configuration options
   */
  function configure(options) {
    config = { ...config, ...options };
  }

  /**
   * Get cache key for translation
   * @param {string} text - Source text
   * @param {string} source - Source language
   * @param {string} target - Target language
   * @returns {string} Cache key
   */
  function getCacheKey(text, source, target) {
    return `${source}:${target}:${text}`;
  }

  /**
   * Add translation to cache
   * @param {string} key - Cache key
   * @param {string} value - Translated text
   */
  function addToCache(key, value) {
    if (!config.cacheEnabled) return;

    // Evict oldest entries if cache is full
    if (cache.size >= config.cacheMaxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, value);
  }

  /**
   * Translate text from source to target language
   * @param {string} text - Text to translate
   * @param {string} source - Source language code
   * @param {string} target - Target language code
   * @returns {Promise<string>} Translated text
   */
  async function translate(text, source, target) {
    // Return original if same language
    if (source === target) {
      return text;
    }

    // Return original if empty
    if (!text || !text.trim()) {
      return text;
    }

    // Check cache
    const cacheKey = getCacheKey(text, source, target);
    if (config.cacheEnabled && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: source,
          target: target
        })
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const result = await response.json();
      const translatedText = result.translatedText;

      // Cache result
      addToCache(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text on error
      return text;
    }
  }

  /**
   * Translate message object
   * @param {Object} message - Message with text and lang properties
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} Message with translated text
   */
  async function translateMessage(message, targetLang) {
    const translatedText = await translate(message.text, message.lang, targetLang);
    return {
      ...message,
      translatedText,
      originalText: message.text,
      originalLang: message.lang
    };
  }

  /**
   * Batch translate multiple texts
   * @param {string[]} texts - Array of texts to translate
   * @param {string} source - Source language code
   * @param {string} target - Target language code
   * @returns {Promise<string[]>} Array of translated texts
   */
  async function translateBatch(texts, source, target) {
    return Promise.all(texts.map(text => translate(text, source, target)));
  }

  /**
   * Get supported languages
   * @returns {Object} Language codes and names
   */
  function getLanguages() {
    return { ...LANGUAGES };
  }

  /**
   * Get language name by code
   * @param {string} code - Language code
   * @returns {string} Language name or code if not found
   */
  function getLanguageName(code) {
    return LANGUAGES[code]?.name || code;
  }

  /**
   * Get native language name by code
   * @param {string} code - Language code
   * @returns {string} Native language name or code if not found
   */
  function getNativeLanguageName(code) {
    return LANGUAGES[code]?.native || code;
  }

  /**
   * Check if language is supported
   * @param {string} code - Language code
   * @returns {boolean} True if supported
   */
  function isLanguageSupported(code) {
    return code in LANGUAGES;
  }

  /**
   * Detect user's preferred language from browser
   * @returns {string} Language code
   */
  function detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();
    return isLanguageSupported(langCode) ? langCode : 'en';
  }

  /**
   * Clear translation cache
   */
  function clearCache() {
    cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache size and max size
   */
  function getCacheStats() {
    return {
      size: cache.size,
      maxSize: config.cacheMaxSize
    };
  }

  // Public API
  return {
    configure,
    translate,
    translateMessage,
    translateBatch,
    getLanguages,
    getLanguageName,
    getNativeLanguageName,
    isLanguageSupported,
    detectBrowserLanguage,
    clearCache,
    getCacheStats
  };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnclaweTranslate;
}
