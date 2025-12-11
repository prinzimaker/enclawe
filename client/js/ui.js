// ------------------------------------------------------------
// EnclaWe 1.0   Rel 251212
// December 2025
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Aldus Prinzimaker
// ------------------------------------------------------------
// File: client/js/ui.js
// UI module - User interface manipulation and rendering
// ------------------------------------------------------------

const EnclaweUI = (function() {
  'use strict';

  // DOM element cache
  const elements = {};

  /**
   * Initialize UI with element selectors
   * @param {Object} selectors - Map of element names to selectors
   */
  function init(selectors) {
    for (const [name, selector] of Object.entries(selectors)) {
      elements[name] = document.querySelector(selector);
    }
  }

  /**
   * Get cached element
   * @param {string} name - Element name
   * @returns {Element|null} DOM element
   */
  function getElement(name) {
    return elements[name] || null;
  }

  /**
   * Show an element
   * @param {string|Element} element - Element name or DOM element
   */
  function show(element) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      el.classList.remove('hidden');
      el.style.display = '';
    }
  }

  /**
   * Hide an element
   * @param {string|Element} element - Element name or DOM element
   */
  function hide(element) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  }

  /**
   * Toggle element visibility
   * @param {string|Element} element - Element name or DOM element
   * @param {boolean} visible - Force visibility state
   */
  function toggle(element, visible) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      if (visible === undefined) {
        el.classList.toggle('hidden');
      } else if (visible) {
        show(el);
      } else {
        hide(el);
      }
    }
  }

  /**
   * Set element text content
   * @param {string|Element} element - Element name or DOM element
   * @param {string} text - Text content
   */
  function setText(element, text) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      el.textContent = text;
    }
  }

  /**
   * Set element HTML content
   * @param {string|Element} element - Element name or DOM element
   * @param {string} html - HTML content
   */
  function setHtml(element, html) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      el.innerHTML = html;
    }
  }

  /**
   * Add class to element
   * @param {string|Element} element - Element name or DOM element
   * @param {string} className - Class name to add
   */
  function addClass(element, className) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      el.classList.add(className);
    }
  }

  /**
   * Remove class from element
   * @param {string|Element} element - Element name or DOM element
   * @param {string} className - Class name to remove
   */
  function removeClass(element, className) {
    const el = typeof element === 'string' ? elements[element] : element;
    if (el) {
      el.classList.remove(className);
    }
  }

  /**
   * Create a message element
   * @param {Object} message - Message data
   * @param {boolean} isOwn - Whether message is from current user
   * @returns {Element} Message DOM element
   */
  function createMessageElement(message, isOwn = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${isOwn ? 'message-own' : 'message-other'}`;
    wrapper.dataset.messageId = message.id || '';

    const header = document.createElement('div');
    header.className = 'message-header';

    const sender = document.createElement('span');
    sender.className = 'message-sender';
    sender.textContent = message.sender;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(message.ts);

    header.appendChild(sender);
    header.appendChild(time);

    const content = document.createElement('div');
    content.className = 'message-content';

    const text = document.createElement('p');
    text.className = 'message-text';
    text.textContent = message.translatedText || message.text;

    content.appendChild(text);

    // Show original text if translated
    if (message.translatedText && message.translatedText !== message.text) {
      const original = document.createElement('p');
      original.className = 'message-original';
      original.textContent = message.text;
      content.appendChild(original);
    }

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    return wrapper;
  }

  /**
   * Create a system message element
   * @param {string} text - System message text
   * @param {string} type - Message type (info, warning, error)
   * @returns {Element} System message DOM element
   */
  function createSystemMessage(text, type = 'info') {
    const wrapper = document.createElement('div');
    wrapper.className = `system-message system-message-${type}`;

    const content = document.createElement('span');
    content.textContent = text;

    wrapper.appendChild(content);
    return wrapper;
  }

  /**
   * Add message to chat container
   * @param {Element} container - Chat container element
   * @param {Element} messageElement - Message element to add
   * @param {boolean} scrollToBottom - Whether to scroll to bottom
   */
  function addMessage(container, messageElement, scrollToBottom = true) {
    container.appendChild(messageElement);
    if (scrollToBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Clear all messages from container
   * @param {Element} container - Chat container element
   */
  function clearMessages(container) {
    container.innerHTML = '';
  }

  /**
   * Create participant list item
   * @param {string} identity - Participant identity
   * @param {boolean} isCurrentUser - Whether this is current user
   * @returns {Element} Participant list item element
   */
  function createParticipantItem(identity, isCurrentUser = false) {
    const item = document.createElement('li');
    item.className = 'participant-item';
    if (isCurrentUser) {
      item.classList.add('participant-current');
    }
    item.textContent = identity;
    item.dataset.identity = identity;
    return item;
  }

  /**
   * Update participants list
   * @param {Element} container - Participants container element
   * @param {string[]} participants - Array of participant identities
   * @param {string} currentIdentity - Current user's identity
   */
  function updateParticipants(container, participants, currentIdentity) {
    container.innerHTML = '';
    participants.forEach(identity => {
      const item = createParticipantItem(identity, identity === currentIdentity);
      container.appendChild(item);
    });
  }

  /**
   * Format timestamp to time string
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted time string
   */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Show notification toast
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {number} duration - Duration in milliseconds
   */
  function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    const container = document.getElementById('notifications') || document.body;
    container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('notification-show');
    });

    // Remove after duration
    setTimeout(() => {
      notification.classList.remove('notification-show');
      notification.classList.add('notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * Show loading state
   * @param {boolean} loading - Whether to show loading
   * @param {string} message - Loading message
   */
  function showLoading(loading, message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');

    if (loading) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
          <div class="loading-spinner"></div>
          <p class="loading-message">${message}</p>
        `;
        document.body.appendChild(overlay);
      } else {
        overlay.querySelector('.loading-message').textContent = message;
      }
      show(overlay);
    } else if (overlay) {
      hide(overlay);
    }
  }

  /**
   * Set connection status indicator
   * @param {string} status - Connection status
   */
  function setConnectionStatus(status) {
    const indicator = elements.connectionStatus;
    if (indicator) {
      indicator.className = `connection-status connection-${status}`;
      indicator.title = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard', 'success');
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy', 'error');
      return false;
    }
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  return {
    init,
    getElement,
    show,
    hide,
    toggle,
    setText,
    setHtml,
    addClass,
    removeClass,
    createMessageElement,
    createSystemMessage,
    addMessage,
    clearMessages,
    createParticipantItem,
    updateParticipants,
    formatTime,
    showNotification,
    showLoading,
    setConnectionStatus,
    copyToClipboard,
    escapeHtml
  };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnclaweUI;
}
