/**
 * Proxy messages from web page to background.
 * Proxy messages from background to web page.
 */
(function(window) {
  'use strict';

  if (window === window.top) {
    return;
  }

  /**
   * Extension background port.
   */
  var port = chrome.runtime.connect({name: 'proxy'});

  /**
   * Proxy messages from background to web page.
   */
  port.onMessage.addListener(function(message) {
    sendToFallback(message.action, message.data);
  });

  /**
   * Proxy messages from web page to background.
   */
  window.addEventListener('message', function(event) {
    if (event.source !== window) {
      return;
    }
    if (event.data.hasOwnProperty('type') && event.data.type.toString() === 'fallback_from') {
      sendToBackground(event.data.action, event.data.data);
    }
  }, false);

  /**
   * Send message to background extension.
   * @param {string} action
   * @param {string=} data
   */
  function sendToBackground(action, data) {
    port.postMessage({action: action, data: typeof data !== 'undefined' ? data : null});
  }

  /**
   * Send message to fallback web page.
   * @param {string} action
   * @param {string} data
   */
  function sendToFallback(action, data) {
    var message = {
      type: 'fallback_to',
      action: action,
      data: typeof data !== 'undefined' ? data : null
    };
    window.postMessage(message, '*');
  }
})(window);
