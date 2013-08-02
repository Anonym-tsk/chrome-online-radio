(function(window) {
  /**
   * Audio player.
   * @constructor
   */
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
     * Set player volume.
     * @param volume Volume value from 0 to 100.
     * @returns {*} AudioPlayer
     */
    setVolume: function(volume) {
      this._audio.volume = volume/100;
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
     * Returns players error.
     * @returns {Function|Error|MediaError|Function|Function|.ajax.error|On.error|Function|C.error}
     */
    getError: function() {
      return this._audio.error;
    }
  };

  window.AudioPlayer = AudioPlayer;
})(window);