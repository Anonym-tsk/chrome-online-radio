(function(window) {
  /**
   * HTML5 audio player.
   * @constructor
   */
  var HtmlPlayer = function() {
    this._audio = document.createElement('audio');
    this._audio.preload = 'auto';
    document.body.appendChild(this._audio);
  };

  HtmlPlayer.prototype = {
    /**
     * @param {String} name
     * @param {Function} callback
     * @param {*} scope
     * @returns {HtmlPlayer}
     */
    bind: function(name, callback, scope) {
      switch (name) {
        case 'play':
          this._audio.addEventListener('play', callback.bind(scope));
          this._audio.addEventListener('loadstart', function() {
            if (this.status !== 'buffering' && this.status !== 'stopped') {
              callback.call(this);
            }
          }.bind(scope));
          break;
        case 'playing':
        case 'abort':
        case 'error':
          this._audio.addEventListener(name, callback.bind(scope));
          break;
        default:
          console.warn('Unsupported event type', name);
      }
      return this;
    },

    /**
     * Start playing.
     * @param {String} url Stream (or file) url.
     * @returns {HtmlPlayer}
     */
    play: function(url) {
      url = url || this._audio.src;
      this._audio.src = url;
      this._audio.play();
      return this;
    },

    /**
     * Stop playing.
     * @returns {HtmlPlayer}
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
     * @param {String} type
     * @returns {boolean}
     */
    canPlayType: function(type) {
      type = type || 'audio/mpeg; codecs="mp3"';
      return !!this._audio.canPlayType(type);
    }
  };

  window.HtmlPlayer = HtmlPlayer;
})(window);