(function(window) {
  'use strict';

  /**
   * Base storage class.
   * @constructor
   */
  function DataStorage() {
    this._favorites = JSON.parse(localStorage.getItem('_favorites')) || {};
    // TODO: При инициализации нужно переписывать веса, чтобы небыло бесконечного роста веса
    this._last = localStorage.getItem('_last') || '';
    this._coreStations = {};
    this._userStations = JSON.parse(localStorage.getItem('_stations')) || {};
    this._stations = {};
    this._hidden = JSON.parse(localStorage.getItem('_hidden')) || {};
    this._volume = JSON.parse(localStorage.getItem('_volume')) || {current: 80, last: 80};
    this._hotkeys = JSON.parse(localStorage.getItem('_hotkeys')) || {
      playpause: {keyCode: 80, altKey: 1, ctrlKey: 1, shiftKey: 0},
      next: {keyCode: 221, altKey: 1, ctrlKey: 1, shiftKey: 0},
      prev: {keyCode: 219, altKey: 1, ctrlKey: 1, shiftKey: 0},
      volumeup: {keyCode: 187, altKey: 1, ctrlKey: 1, shiftKey: 0},
      volumedown: {keyCode: 189, altKey: 1, ctrlKey: 1, shiftKey: 0}
    };

    // Load stations list
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (function() {
      if (xhr.readyState == 4) {
        this._coreStations = JSON.parse(xhr.responseText);
        this._updateStationsList();
      }
    }).bind(this);
    xhr.open('GET', chrome.extension.getURL('stations.json'), true);
    xhr.send();
  }

  /**
   * Save value to localStorage.
   * @param {string} name
   * @param {*} value
   * @private
   */
  DataStorage.prototype._save = function(name, value) {
    localStorage.setItem(name, value);
  };

  /**
   * Update stations list with core and users stations.
   * @private
   */
  DataStorage.prototype._updateStationsList = function() {
    var stations = {}, i;
    for (i in this._coreStations) if (this._coreStations.hasOwnProperty(i)) {
      stations[i] = this._coreStations[i];
      stations[i]['type'] = 'core';
      stations[i]['hidden'] = this._hidden.hasOwnProperty(i);
    }
    for (i in this._userStations) if (this._userStations.hasOwnProperty(i)) {
      stations[i] = this._userStations[i];
      stations[i]['type'] = 'user';
      stations[i]['hidden'] = false;
    }
    this._stations = stations;
  };

  /**
   * Add a station to favorites.
   * @param {string} name Station name.
   */
  DataStorage.prototype.like = function(name) {
    var keys = Object.keys(this._favorites);
    this._favorites[name] = keys.length > 0 ? this._favorites[keys[keys.length - 1]] + 1 : 1;
    this._save('_favorites', JSON.stringify(this._favorites));
  };

  /**
   * Remove a station from favorites.
   * @param {string} name Station name.
   */
  DataStorage.prototype.dislike = function(name) {
    if (this.isFavorite(name)) {
      delete this._favorites[name];
    }
    this._save('_favorites', JSON.stringify(this._favorites));
  };

  /**
   * Check station in favorites.
   * @param {string} name Station name.
   * @return {?Object}
   */
  DataStorage.prototype.isFavorite = function(name) {
    return this._favorites.hasOwnProperty(name) ? this._favorites[name] : false;
  };

  /**
   * Get names of favorites.
   * @return {Object}
   */
  DataStorage.prototype.getFavorites = function() {
    return this._favorites;
  };

  /**
   * Get all stations.
   * @return {Object}
   */
  DataStorage.prototype.getStations = function() {
    return this._stations;
  };

  /**
   * Get station by name.
   * @param {string} name Station name.
   * @return {?Object}
   */
  DataStorage.prototype.getStationByName = function(name) {
    if (this._stations.hasOwnProperty(name)) {
      var station = this._stations[name];
      station.name = name;
      return station;
    }
    return null;
  };

  /**
   * Set the last played station.
   * @param {string} name Station name.
   */
  DataStorage.prototype.setLast = function(name) {
    this._last = name;
    this._save('_last', this._last);
  };

  /**
   * Get the last played station name.
   * @return {string}
   */
  DataStorage.prototype.getLastName = function() {
    return this._last;
  };

  /**
   * Get the last played station.
   * @return {Object}
   */
  DataStorage.prototype.getLastStation = function() {
    return this.getStationByName(this._last);
  };

  /**
   * Save volume value.
   * @param {number} volume Volume.
   */
  DataStorage.prototype.setVolume = function(volume) {
    var last = this._volume.current;
    this._volume = {current: volume, last: last};
    this._save('_volume', JSON.stringify(this._volume));
  };

  /**
   * Get volume.
   * @return {number}
   */
  DataStorage.prototype.getVolume = function() {
    return this._volume.current;
  };

  /**
   * Get last before current volume value.
   * @return {number}
   */
  DataStorage.prototype.getVolumeLast = function() {
    return this._volume.last;
  };

  /**
   * Save users station.
   * @param {Object} station Station object.
   * @param {string|number=} name Station name for update station.
   */
  DataStorage.prototype.addStation = function(station, name) {
    if (!name) {
      var keys = Object.keys(this._userStations);
      name = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
    }
    this._userStations[name] = station;
    this._save('_stations', JSON.stringify(this._userStations));
    this._updateStationsList();
  };

  /**
   * Delete users station.
   * @param {string} name Station name.
   */
  DataStorage.prototype.deleteStation = function(name) {
    if (this._userStations.hasOwnProperty(name)) {
      delete this._userStations[name];
      this._save('_stations', JSON.stringify(this._userStations));
      this._updateStationsList();
    }
    else if (this._coreStations.hasOwnProperty(name)) {
      this._hidden[name] = 1;
      this._save('_hidden', JSON.stringify(this._hidden));
      this._updateStationsList();
    }
  };

  /**
   * Restore deleted core station.
   * @param {string} name Station name.
   */
  DataStorage.prototype.restoreStation = function(name) {
    if (this._hidden.hasOwnProperty(name)) {
      delete this._hidden[name];
      this._save('_hidden', JSON.stringify(this._hidden));
      this._updateStationsList();
    }
  };

  /**
   * Get hotkeys.
   * @return {Object}
   */
  DataStorage.prototype.getHotkeys = function() {
    return this._hotkeys;
  };

  /**
   * Save hotkey.
   * @param {string} name
   * @param {number} altKey
   * @param {number} ctrlKey
   * @param {number} shiftKey
   * @param {number} keyCode
   */
  DataStorage.prototype.setHotkey = function(name, altKey, ctrlKey, shiftKey, keyCode) {
    if (this._hotkeys.hasOwnProperty(name)) {
      this._hotkeys[name] = {keyCode: keyCode, altKey: altKey, ctrlKey: ctrlKey, shiftKey: shiftKey};
      this._save('_hotkeys', JSON.stringify(this._hotkeys));
    }
  };

  window.DataStorage = DataStorage;
})(window);
