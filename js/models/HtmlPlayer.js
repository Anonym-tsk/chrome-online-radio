(function(window) {
  'use strict';

  /**
   * HTML5 audio player.
   * @param {number} volume
   * @constructor
   */
  function HtmlPlayer(volume) {
    this._audio = document.createElement('audio');
    this._audio.preload = 'auto';
    document.body.appendChild(this._audio);
    this.setVolume(volume);
  }

  /**
   * @param {string} name
   * @param {function} callback
   * @param {*} scope
   * @return {HtmlPlayer}
   */
  HtmlPlayer.prototype.bind = function(name, callback, scope) {
    switch (name) {
      case 'play':
      case 'playing':
      case 'abort':
      case 'volumechange':
        this._audio.addEventListener(name, callback.bind(scope));
        break;
      case 'error':
        this._audio.addEventListener('error', callback.bind(scope));
        this._audio.addEventListener('stalled', callback.bind(scope));
        break;
      default:
        console.warn('Unsupported event type', name);
    }
    return this;
  };

  /**
   * Start playing.
   * @param {string=} url Stream (or file) url.
   * @return {HtmlPlayer}
   */
  HtmlPlayer.prototype.play = function(url) {
    url = url || this._audio.src;
    this._audio.src = url;
    this._audio.play();
    return this;
  };

  /**
   * Stop playing.
   * @return {HtmlPlayer}
   */
  HtmlPlayer.prototype.stop = function() {
    this._audio.pause();
    this._audio.src = '';
    return this;
  };

  /**
   * Set player volume.
   * @param {number} volume Volume value from 0 to 100.
   * @return {HtmlPlayer}
   */
  HtmlPlayer.prototype.setVolume = function(volume) {
    this._audio.volume = (volume / 100).toFixed(2);
    return this;
  };

  /**
   * Get player volume.
   * @return {number}
   */
  HtmlPlayer.prototype.getVolume = function() {
    return Math.round(this._audio.volume * 100);
  };

  /**
   * Is playing now?
   * @return {boolean}
   */
  HtmlPlayer.prototype.isPlaying = function() {
    return !this._audio.paused && !this._audio.ended && (this._audio.readyState === 4 || this._audio.networkState === 2);
  };

  /**
   * Get audio data for equalizer.
   * @return {Uint8Array}
   */
  HtmlPlayer.prototype.getAudioData = function() {
    var getAudioAnalyser = (function() {
      var context = new webkitAudioContext();
      var analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 128;
      var source = context.createMediaElementSource(this._audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      return analyser;
    }).bind(this);

    this._audioAnalyser = this._audioAnalyser || getAudioAnalyser();
    var freqByteData = new Uint8Array(this._audioAnalyser.frequencyBinCount);
    this._audioAnalyser.getByteFrequencyData(freqByteData);

    return freqByteData;
  };

  /**
   * Check browser can play mp3.
   * @param {function} callback
   */
  HtmlPlayer.prototype.canPlayMP3 = function(callback) {
    try {
      var audio = new Audio();
      if (audio.canPlayType('audio/mpeg; codecs="mp3"') == 'probably') {
        callback(true);
      }
      else {
        audio.addEventListener('canplaythrough', function (e) {
          callback(true);
        }, false);
        audio.addEventListener('error', function (e) {
          callback(false, this.error);
        }, false);
      }
      audio.src = "data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      audio.load();
    }
    catch(e){
      callback(false, e);
    }
  };

  window.HtmlPlayer = HtmlPlayer;
})(window);
