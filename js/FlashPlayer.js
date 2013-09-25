(function(window) {
  /**
   * Flash audio player.
   * @constructor
   */
  var FlashPlayer = function() {
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
      if (port.hasOwnProperty('name') && port.name == 'content') {
        this._port = port;

        port.onMessage.addListener(function(message) {
          switch (message.action) {
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
     * Render equalizer in popup window.
     * @param canvas
     */
    equalizer: function(canvas) {
      const BAR_WIDTH = 3; // Ширина полоски
      const SPACER_WIDTH = 1; // Ширина отступа

      var canvasWidth = canvas.width,
          canvasHeight = canvas.height;
      var numBars = Math.round(canvasWidth / (SPACER_WIDTH + BAR_WIDTH));

      // Canvas context
      var canvasContext = canvas.getContext('2d');
      var gradient = canvasContext.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(1,'#0088cc');
      gradient.addColorStop(0.5,'#00719f');
      gradient.addColorStop(0,'#005E84');
      canvasContext.fillStyle = gradient;

      var freqByteData = [];
      var drawFrame = function(win, time) {
        win.requestAnimationFrame(drawFrame.bind(this, win), canvas);
        canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

        var isKeyFrame = !(Math.round(time) % 10);
        for (var i = 0; i < numBars; ++i) {
          if (isKeyFrame && this._isPlaying) {
            var magnitude = Math.floor(Math.random() * canvasHeight) + 1;
            if (!freqByteData[i] || magnitude > freqByteData[i]) {
              freqByteData[i] = magnitude;
            }
          }
          else if (freqByteData[i] > 1) {
            freqByteData[i] -= 1;
          }
          else {
            freqByteData[i] = 1;
          }
          canvasContext.fillRect(i * (SPACER_WIDTH + BAR_WIDTH), canvasHeight, BAR_WIDTH, -freqByteData[i]);
        }
      };

      drawFrame.call(this, canvas.ownerDocument.defaultView, 0);
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