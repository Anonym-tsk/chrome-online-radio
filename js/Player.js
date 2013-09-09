var Player = (function(window) {
  var element = null;
  var _Player = {
    init: function(id, readyCallback, errorCallback) {
      element = $('#' + id);
      element.jPlayer({
        swfPath: 'js/',
        supplied: 'mp3',
        cssSelectorAncestor: '',
        cssSelector: {},
        solution: 'flash',
        volume: 1,
        ready: readyCallback,
        error: errorCallback
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