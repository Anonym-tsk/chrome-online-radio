(function(window) {
  /**
   * HTML5 audio player.
   * @constructor
   */
  var HtmlPlayer = function() {
    this._audio = new Audio();
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
        case 'volumechange':
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
     * Set player volume.
     * @param volume Volume value from 0 to 100.
     * @returns {*} AudioPlayer
     */
    setVolume: function(volume) {
      this._audio.volume = (volume / 100).toFixed(2);
      return this;
    },

    /**
     * Get player volume.
     * @returns {number}
     */
    getVolume: function() {
      return Math.round(this._audio.volume * 100);
    },

    /**
     * Is playing now?
     * @returns {boolean}
     */
    isPlaying: function() {
      return !this._audio.paused && !this._audio.ended && (this._audio.readyState === 4 || this._audio.networkState === 2);
    },

    equalizer: function(canvas) {
      const BAR_WIDTH = 3; // Ширина полоски
      const SPACER_WIDTH = 1; // Ширина отступа
      const FFT_SIZE = 128; // Степень двойки, не ниже 32

      // Canvas context
      var canvasContext = canvas.getContext('2d');
      var gradient = canvasContext.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(1,'#0088cc');
      gradient.addColorStop(0.5,'#00719f');
      gradient.addColorStop(0,'#005E84');
      canvasContext.fillStyle = gradient;

      var getAudioAnalyser = function() {
        var context = new webkitAudioContext();
        var analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = FFT_SIZE;
        var source = context.createMediaElementSource(this._audio);
        source.connect(analyser);
        analyser.connect(context.destination);
        return analyser;
      }.bind(this);

      var drawFrame = function(analyser) {
        this.requestAnimationFrame(drawFrame.bind(this, analyser), canvas);

        var canvasWidth = canvas.width,
            canvasHeight = canvas.height;

        var freqByteData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqByteData);

        var numBars = Math.round(canvasWidth / (SPACER_WIDTH + BAR_WIDTH));
        canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

        for (var i = 0; i < numBars; ++i) {
          var magnitude = Math.ceil(freqByteData[i] * canvasHeight / 255); // 255 is the maximum magnitude of a value in the frequency data
          if (magnitude < 1) {
            magnitude = 1;
          }
          canvasContext.fillRect(i * (SPACER_WIDTH + BAR_WIDTH), canvasHeight, BAR_WIDTH, -magnitude);
        }
      };

      this._audioAnalyser = this._audioAnalyser || getAudioAnalyser();
      drawFrame.call(canvas.ownerDocument.defaultView, this._audioAnalyser);
    },

    /**
     * Check browser can play media.
     * @param {String} [type]
     * @returns {boolean}
     */
    canPlayType: function(type) {
      type = type || 'audio/mpeg; codecs="mp3"';
      return !!this._audio.canPlayType(type);
    }
  };

  window.HtmlPlayer = HtmlPlayer;
})(window);