(function(window) {
  /**
   * Flash audio player.
   * @constructor
   */
  var FlashPlayer = function(volume) {
    this._url = null;
    this._volume = 1;
    this._bindings = {};
    this._isPlaying = false;
    this._frameSrc = 'http://anonym-tsk.github.io/chrome-online-radio/';

    var iFrameObj = document.createElement('iframe');
    iFrameObj.id = 'playerFallback';
    iFrameObj.src = this._frameSrc;
    iFrameObj.scrolling = 'no';
    document.body.appendChild(iFrameObj);

    chrome.runtime.onConnect.addListener(function(port) {
      if (port.hasOwnProperty('name') && port.name == 'proxy') {
        this._port = port;

        port.onMessage.addListener(function(message) {
          switch (message.action) {
            case 'ready':
              this.setVolume(volume);
            case 'playing':
            case 'play':
            case 'abort':
            case 'error':
            case 'volumechange':
              this._isPlaying = (message.action == 'playing');
              if (this._bindings.hasOwnProperty(message.action)) {
                this._bindings[message.action]();
              }
              break;
            case 'flash':
              var bg = chrome.extension.getBackgroundPage();
              bg.Radio.openOptions('flash');
              break;
          }
        }.bind(this));
      }
    }.bind(this));
  };

  FlashPlayer.prototype = {
    /**
     * @param {String} name
     * @param {Function} callback
     * @param {*} scope
     * @returns {FlashPlayer}
     */
    bind: function(name, callback, scope) {
      switch (name) {
        case 'play':
        case 'playing':
        case 'abort':
        case 'error':
        case 'volumechange':
          this._bindings[name] = callback.bind(scope);
          break;
        default:
          console.warn('Unsupported event type', name);
      }
      return this;
    },

    /**
     * Start playing.
     * @param {String} url Stream (or file) url.
     * @returns {FlashPlayer}
     */
    play: function(url) {
      this._url = url || this._url;
      this.sendMessage('play', this._url);
      return this;
    },

    /**
     * Stop playing.
     * @returns {FlashPlayer}
     */
    stop: function() {
      this.sendMessage('stop');
      return this;
    },

    /**
     * Set player volume.
     * @param volume Volume value from 0 to 100.
     * @returns {*} AudioPlayer
     */
    setVolume: function(volume) {
      this._volume = (volume / 100).toFixed(2);
      this.sendMessage('volume', this._volume);
      return this;
    },

    /**
     * Get player volume.
     * @returns {number}
     */
    getVolume: function() {
      return Math.round(this._volume * 100);
    },

    /**
     * Is playing now?
     * @returns {boolean}
     */
    isPlaying: function() {
      return this._isPlaying;
    },

    /**
     * Get audio data for equalizer.
     * @returns {Array}
     */
    getAudioData: function() {
      const NUM_BARS = 64;
      const MIN = 30;
      const MAX = 255;
      const STEP = 5;
      this._freqByteData = this._freqByteData || [];
      this._audioDataCounter = ++this._audioDataCounter || 1;

      var isKeyFrame = !(this._audioDataCounter % 28) && this._isPlaying;
      if (isKeyFrame) {
        this._audioDataCounter = 1;
      }
      for (var i = 0; i < NUM_BARS; ++i) {
        if (isKeyFrame) {
          var magnitude = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
          if (!this._freqByteData[i] || magnitude > this._freqByteData[i]) {
            this._freqByteData[i] = magnitude;
          }
        }
        else if (this._freqByteData[i] > 0) {
          this._freqByteData[i] -= STEP;
        }
        else {
          this._freqByteData[i] = 0;
        }
      }

      return this._freqByteData;
    },

    /**
     * Send message to fallback page.
     * @param {String} action
     * @param {*} [data]
     */
    sendMessage: function(action, data) {
      data = data || {};
      this._port.postMessage({action: action, data: data});
    }
  };

  window.FlashPlayer = FlashPlayer;
})(window);