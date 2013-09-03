(function(window) {
  /**
   * Audio player.
   * @constructor
   */
  var AudioPlayer = function() {
    this._audio = document.createElement('audio');
    this._audio.preload = 'auto';

    if (!this.canPlayType()) {
      console.warn('Flash fallback');
    }

    document.body.appendChild(this._audio);
  };

  AudioPlayer.prototype = {
    /**
     * @param name
     * @param callback
     */
    bind: function(name, callback) {
      this._audio.addEventListener(name, callback);
    },

    /**
     * @param name
     * @param callback
     */
    unbind: function(name, callback) {
      this._audio.removeEventListener(name, callback);
    },

    /**
     * Start playing.
     * @param url Stream (or file) url.
     * @returns {*} AudioPlayer
     */
    play: function(url) {
      url = url || this._audio.src;
      this._audio.src = url;
      this._audio.play();
      return this;
    },

    /**
     * Stop playing.
     * @returns {*} AudioPlayer
     */
    stop: function() {
      this._audio.pause();
      this._audio.src = '';
      return this;
    },

    /**
     * Is playing now?
     * @returns {boolean}
     */
    isPlaying: function() {
      return !this._audio.paused && !this._audio.ended && (this._audio.readyState === 4 || this._audio.networkState === 2);
    },

    /**
     * Check browser can play media.
     * @param type
     * @returns {boolean}
     */
    canPlayType: function(type) {
      type = type || 'audio/mpeg; codecs="mp3"';
      return !!this._audio.canPlayType(type);
    }
  };

  window.AudioPlayer = AudioPlayer;
})(window);