(function(window) {
  var AudioPlayer = function() {
    this._audio = document.createElement('audio');
    this._audio.preload = 'auto';

    this.bind = function(name, callback) {
      this._audio.addEventListener(name, callback);
    };

    this.unbind = function(name, callback) {
      this._audio.removeEventListener(name, callback);
    };

    document.body.appendChild(this._audio);
  };

  AudioPlayer.prototype = {
    play: function(url) {
      url = url || this._audio.src;
      this._audio.src = url;
      this._audio.play();
      return this;
    },

    stop: function() {
      this._audio.pause();
      this._audio.src = '';
      return this;
    },

    setVolume: function(volume) {
      this._audio.volume = volume/100;
      return this;
    },

    isPlaying: function() {
      return !this._audio.paused && !this._audio.ended && (this._audio.readyState === 4 || this._audio.networkState === 2);
    },

    getError: function() {
      return this._audio.error;
    }
  };

  window.AudioPlayer = AudioPlayer;
})(window);