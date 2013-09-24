var Player = (function(window) {
  var element = null;
  var _Player = {
    init: function(id, readyCallback, errorCallback) {
      element = $('#' + id);
      element.jPlayer({
        swfPath: 'js/',
        supplied: 'mp3',
        cssSelectorAncestor: '',
        cssSelector: {
          videoPlay: '', play: '', pause: '', stop: '', seekBar: '', playBar: '', mute: '', unmute: '',
          volumeBar: '', volumeBarValue: '', volumeMax: '', currentTime: '', duration: '',
          fullScreen: '', restoreScreen: '', repeat: '', repeatOff: '', gui: '', noSolution: ''
        },
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
      console.log('play', url);
      element.jPlayer('setMedia', {mp3: url});
      element.jPlayer('play');
    },
    stop: function() {
      console.log('stop');
      element.jPlayer('stop');
    },
    setVolume: function(volume) {
      console.log('setVolume', volume);
      element.jPlayer('volume', volume);
    }
  };

  return _Player;
})(window);