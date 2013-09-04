(function(window) {
  $(document).ready(function() {
    Player.init(function() {
      Player.bind($.jPlayer.event.loadstart, function(event) {
        sendMessage('play');
      });
      Player.bind($.jPlayer.event.play, function(event) {
        sendMessage('playing');
      });
      Player.bind($.jPlayer.event.error, function(event) {
        sendMessage('error');
      });
      Player.bind($.jPlayer.event.pause, function(event) {
        sendMessage('abort');
      });
    });

    var sendMessage = function(action, data) {
      var message = {
        type: 'fallback_from',
        action: action,
        data: data || {}
      }
      window.postMessage(message, '*');
    };

    window.addEventListener('message', function(event) {
      if (event.source != window) {
        return;
      }
      if (event.data.hasOwnProperty('type') && event.data.type == 'fallback_to') {
        switch (event.data.action) {
          case 'play':
            Player.play(event.data.data);
            break;
          case 'stop':
            Player.stop();
            break;
        }
      }
    }, false);
  });
})(window);