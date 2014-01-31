/**
 * Proxy interface.
 * Proxy messages from web page to background.
 * Proxy messages from background to web page.
 */
(function(window) {
  if (window === window.top) {
    return;
  }
  /**
   * Extension background port.
   */
  var port = chrome.runtime.connect({name: 'proxy'});

  /**
   * Send message to background extension.
   * @param action
   * @param data
   */
  var sendToBackground = function(action, data) {
    data = data || {};
    port.postMessage({action: action, data: data});
  };

  /**
   * Send message to fallback web page.
   * @param action
   * @param data
   */
  var sendToFallback = function(action, data) {
    var message = {
      type: 'fallback_to',
      action: action,
      data: data || {}
    };
    window.postMessage(message, '*');
  };

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
    if (event.source != window) {
      return;
    }
    if (event.data.hasOwnProperty('type') && event.data.type == 'fallback_from') {
      sendToBackground(event.data.action, event.data.data);
    }
  }, false);
})(window);