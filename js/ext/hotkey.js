(function(window) {
  var port = chrome.runtime.connect({name: 'hotkey'});
  var keys = {};
  var codes = {};

  port.onMessage.addListener(function(message) {
    keys = message;
    for (var i in keys) if (keys.hasOwnProperty(i)) {
      codes[keys[i].keyCode] = i;
    }
  });

  var sendToBackground = function(action, data) {
    data = data || {};
    port.postMessage({action: action, data: data});
  };

  document.addEventListener('keyup', function(e) {
    if (!codes.hasOwnProperty(e.which)) {
      return;
    }
    var key = keys[codes[e.which]];
    if (!!key.altKey === e.altKey && !!key.ctrlKey === e.ctrlKey && !!key.shiftKey === e.shiftKey) {
      sendToBackground(codes[e.which]);
    }
  }, false);
})(window);