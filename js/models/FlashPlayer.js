define(['models/DataStorage'], function(DataStorage) {
  'use strict';

  /**
   * Stream url.
   * @type {string}
   * @private
   */
  var _url = null;

  /**
   * Current volume.
   * @type {number}
   * @private
   */
  var _volume = 1;

  /**
   * Event handlers.
   * @type {{}}
   * @private
   */
  var _bindings = {};

  /**
   * Is playing now.
   * @type {boolean}
   * @private
   */
  var _isPlaying = false;

  /**
   * Port with proxy.
   * @type {Port}
   */
  var _port;

  /**
   * Flash player iframe url.
   * @const
   * @type {string}
   */
  var FRAME_SRC = 'http://radio.css3.su/';

  /**
   * Attach event handler to player.
   * @param {string} name
   * @param {function} callback
   */
  function attachEvent(name, callback) {
    switch (name) {
      case 'play':
      case 'playing':
      case 'abort':
      case 'error':
      case 'volumechange':
        _bindings[name] = callback;
        break;
      default:
        console.warn('Unsupported event type', name);
    }
  }

  /**
   * Send message to fallback page.
   * @param {string} action
   * @param {number|string=} data
   */
  function sendMessage(action, data) {
    _port.postMessage({action: action, data: typeof data != 'undefined' ? data : null});
  }

  /**
   * Start playing.
   * @param {string=} url Stream (or file) url.
   */
  function play(url) {
    _url = url || _url;
    sendMessage('play', _url);
  }

  /**
   * Stop playing.
   */
  function stop() {
    sendMessage('stop');
  }

  /**
   * Get player volume.
   * @return {number}
   */
  function getVolume() {
    return Math.round(_volume * 100);
  }

  /**
   * Set player volume.
   * @param {number} volume Volume value from 0 to 100.
   */
  function setVolume(volume) {
    _volume = (volume / 100).toFixed(2);
    sendMessage('volume', _volume);
  }

  /**
   * Is playing now?
   * @return {boolean}
   */
  function isPlaying() {
    return _isPlaying;
  }

  /**
   * Get audio data for equalizer.
   * @return {Array}
   */
  function getAudioData() {
    var NUM_BARS = 64,
      MIN = 30,
      MAX = 255,
      STEP = 5;
    this._freqByteData = this._freqByteData || [];
    this._audioDataCounter = ++this._audioDataCounter || 1;

    var isKeyFrame = !(this._audioDataCounter % 28) && _isPlaying;
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
  }

  /**
   * Init player.
   */
  function init() {
    console.info('Flash fallback');

    // Init iframe
    var iFrameObj = document.createElement('iframe');
    iFrameObj.id = 'playerFallback';
    iFrameObj.src = FRAME_SRC;
    iFrameObj.scrolling = 'no';
    document.body.appendChild(iFrameObj);

    // Listen messages from proxy
    chrome.runtime.onConnect.addListener(function(port) {
      if (port.name == 'proxy') {
        _port = port;

        port.onMessage.addListener(function(message) {
          switch (message.action) {
            case 'ready':
              setVolume(DataStorage.getVolume());
            case 'playing':
            case 'play':
            case 'abort':
            case 'error':
            case 'volumechange':
              _isPlaying = (message.action == 'playing');
              if (_bindings.hasOwnProperty(message.action)) {
                _bindings[message.action]();
              }
              break;
            case 'flash':
              var bg = chrome.extension.getBackgroundPage();
              bg.openOptions('flash');
              break;
          }
        });
      }
    });
  }

  /**
   * @typedef {{}} FlashPlayer
   */
  return {
    init: init,
    attachEvent: attachEvent,
    play: play,
    stop: stop,
    setVolume: setVolume,
    getVolume: getVolume,
    isPlaying: isPlaying,
    getAudioData: getAudioData
  };
});
