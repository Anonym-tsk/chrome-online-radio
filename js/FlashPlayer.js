(function(window) {
  /**
   * Flash audio player.
   * @constructor
   */
  var FlashPlayer = function() {
    this._url = null;
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
      url = url || this._url;
      this._url = url;
      this.sendMessage('play', url);
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
      // TODO
//      this._audio.volume = volume / 100;
      return this;
    },

    /**
     * Get player volume.
     * @returns {number}
     */
    getVolume: function() {
      // TODO
//      return this._audio.volume * 100;
      return 100;
    },

    /**
     * Is playing now?
     * @returns {boolean}
     */
    isPlaying: function() {
      return this._isPlaying;
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