define(function() {
  'use strict';

  /**
   * Station class.
   * @param {string} name
   * @param {string} title
   * @param {string} domain
   * @param {string} frequency
   * @param {{}} streams
   * @param {string=} logo
   * @constructor
   */
  function Station(name, title, domain, frequency, streams, logo) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;

    /**
     * Title.
     * @type {string}
     */
    this.title = title;

    /**
     * Stations site url.
     * @type {string}
     */
    this.url = 'http://' + domain;

    /**
     * Stations frequency.
     */
    this.frequency = frequency;

    /**
     * Streams object.
     * @type {{string: string}}
     */
    this.streams = (function() {
      var result = {};
      streams.forEach(function(stream) {
        result[stream.kbps + 'K'] = stream.src;
      });
      return result;
    })();

    /**
     * Image url.
     * @type {string}
     */
    this.image = 'http://www.kp.ru/img/unisound_radioplayer/v2/' + (logo ? 'logos/' + logo : 'russia_logo.png');

    /**
     * Current station index.
     * @type {string}
     * @private
     */
    this._currentStreamName = '0';
  }

  /**
   * Current stream name.
   * @return {string}
   */
  Station.prototype.getStreamName = function() {
    if (!this.streams[this._currentStreamName]) {
      var names = Object.keys(this.streams);
      this._currentStreamName = names[0].toString();
    }
    return this._currentStreamName;
  };

  /**
   * Next stream.
   * @return {string}
   */
  Station.prototype.getNextStream = function() {
    var names = Object.keys(this.streams),
        index = names.indexOf(this._currentStreamName),
        newIndex = (index + 1) % names.length;
    return this.getStream(names[newIndex]);
  };

  /**
   * Current stream.
   * @param {string} name=
   * @return {string}
   */
  Station.prototype.getStream = function(name) {
    if (typeof name !== 'undefined') {
      this._currentStreamName = name.toString();
    }
    return this.streams[this.getStreamName()];
  };

  /**
   * @typedef {function} Station
   */
  return Station;
});
