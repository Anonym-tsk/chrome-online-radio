define(function() {
  'use strict';

  /**
   * Array to object converter.
   * @param {[]} arr
   * @return {{}}
   * @private
   */
  function _arrayToObject(arr) {
    return arr.reduce(function(o, v, i) {
      o[i] = v;
      return o;
    }, {});
  }

  /**
   * Station class.
   * @param {string} name
   * @param {string} title
   * @param {string} url
   * @param {{string: string}|[]} streams
   * @param {string=} image
   * @param {boolean=} isUserStation
   * @param {boolean=} isHidden
   * @constructor
   */
  function Station(name, title, url, streams, image, isUserStation, isHidden) {
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
    this.url = url;

    /**
     * Streams object.
     * @type {{string: string}}
     */
    this.streams = Array.isArray(streams) ? _arrayToObject(streams) : streams;

    /**
     * Image url.
     * @type {string}
     */
    this.image = image || '';

    /**
     * Is users station.
     * @type {boolean}
     * @private
     */
    this._userStation = !!isUserStation;

    /**
     * Is hidden.
     * @type {boolean}
     * @private
     */
    this._hidden = !!isHidden;

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
   * Is hidden station.
   * @return {boolean}
   */
  Station.prototype.isHidden = function() {
    return this._hidden;
  };

  /**
   * Set hidden attribute.
   * @param {boolean} isHidden
   */
  Station.prototype.setHidden = function(isHidden) {
    this._hidden = !!isHidden;
  };

  /**
   * Is users station.
   * @return {boolean}
   */
  Station.prototype.isUserStation = function() {
    return this._userStation;
  };

  /**
   * Is core station.
   * @return {boolean}
   */
  Station.prototype.isCoreStation = function() {
    return !this._userStation;
  };

  /**
   * @typedef {function} Station
   */
  return Station;
});
