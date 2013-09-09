var Player = (function(window) {
  var element = null;
  var id = 'player';

  var _Player = {
    init: function(callback, scope) {
      element = $('#' + id);
      element.jPlayer({
        ready: function () {
          if (typeof callback == 'function') {
            if (typeof scope != 'undefined') {
              callback.call(scope);
            }
            else {
              callback();
            }
          }
        },
        swfPath: 'js/',
        supplied: 'mp3',
        cssSelectorAncestor: '',
        cssSelector: {},
        solution: 'flash',
        volume: 1
      });
    },
    bind: function(name, callback) {
      element.bind(name, callback);
    },
    isPlaying: function() {
      var status = element.data("jPlayer").status;
      return !status.ended && !status.paused;
    },
    play: function(url) {
      console.warn('play', url);
      element.jPlayer('setMedia', {mp3: url});
      element.jPlayer('play');
    },
    stop: function() {
      console.warn('stop');
      element.jPlayer('stop');
    }
  };

  return _Player;
})(window);