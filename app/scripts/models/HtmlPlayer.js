define(['models/DataStorage'], function(DataStorage) {
  'use strict';

  /**
   * HTML5 Audio player.
   * @type {HTMLAudioElement}
   */
  var _audio;

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
      case 'volumechange':
        _audio.addEventListener(name, callback);
        break;
      case 'error':
        _audio.addEventListener('error', callback);
        _audio.addEventListener('stalled', callback);
        break;
      default:
        console.warn('Unsupported event type', name);
    }
  }

  /**
   * Start playing.
   * @param {string=} url Stream (or file) url.
   */
  function play(url) {
    url = url || _audio.src;
    _audio.src = url;
    _audio.play().catch(function() {
      // pass
    })
  }

  /**
   * Stop playing.
   */
  function stop() {
    _audio.pause();
    _audio.src = '';
  }

  /**
   * Set player volume.
   * @param {number} volume Volume value from 0 to 100.
   */
  function setVolume(volume) {
    _audio.volume = (volume / 100).toFixed(2);
  }

  /**
   * Get player volume.
   * @return {number}
   */
  function getVolume() {
    return Math.round(_audio.volume * 100);
  }

  /**
   * Is playing now?
   * @return {boolean}
   */
  function isPlaying() {
    return !_audio.paused && !_audio.ended && (_audio.readyState === 4 || _audio.networkState === 2);
  }

  /**
   * Get audio data for equalizer.
   * @return {Uint8Array}
   */
  function getAudioData() {
    var getAudioAnalyser = function() {
      var context = new window.AudioContext();
      var analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 128;
      var source = context.createMediaElementSource(_audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      return analyser;
    }.bind(this);

    this._audioAnalyser = this._audioAnalyser || getAudioAnalyser();
    var freqByteData = new Uint8Array(this._audioAnalyser.frequencyBinCount);
    this._audioAnalyser.getByteFrequencyData(freqByteData);

    return freqByteData;
  }

  /**
   * Init player.
   */
  function init() {
    _audio = new Audio();
    _audio.preload = 'auto';
    _audio.crossOrigin = 'anonymous';
    setVolume(DataStorage.getVolume());
  }

  /**
   * @typedef {{}} HtmlPlayer
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
