define(['models/Station'], function(Station) {
  'use strict';

  /**
   * Favorites.
   * @type {[]}
   */
  var _favorites = (JSON.parse(localStorage.getItem('_favorites')) || []).map(function(item) {
    return item.toString();
  });

  /**
   * Last station name.
   * @type {string}
   */
  var _last = localStorage.getItem('_last') || '';

  /**
   * Core stations.
   * @type {{}}
   */
  var _coreStations = {};

  /**
   * Volume.
   * @type {{current: number, last: number}}
   */
  var _volume = JSON.parse(localStorage.getItem('_volume')) || {current: 80, last: 80};

  /**
   * Save value to localStorage.
   * @param {string} name
   * @param {string} value
   * @private
   */
  function _save(name, value) {
    localStorage.setItem(name.toString(), value.toString());
  }

  /**
   * Add a station to favorites.
   * @param {string} name Station name.
   * @public
   */
  function like(name) {
    if (!isFavorite(name)) {
      _favorites.push(name);
    }
    _save('_favorites', JSON.stringify(_favorites));
  }

  /**
   * Remove a station from favorites.
   * @param {string} name Station name.
   * @public
   */
  function dislike(name) {
    var index = _favorites.indexOf(name);
    if (index >= 0) {
      _favorites.splice(index, 1);
    }
    _save('_favorites', JSON.stringify(_favorites));
  }

  /**
   * Check station in favorites.
   * @param {string} name Station name.
   * @return {boolean}
   * @public
   */
  function isFavorite(name) {
    return _favorites.indexOf(name) >= 0;
  }

  /**
   * Get names of favorites.
   * @return {Object}
   * @public
   */
  function getFavorites() {
    return _favorites;
  }

  /**
   * Set all favorites.
   * @param {[]} favorites
   */
  function setFavorites(favorites) {
    _favorites = favorites;
    _save('_favorites', JSON.stringify(_favorites));
  }

  /**
   * Get all stations.
   * @return {{}}
   * @public
   */
  function getStations() {
    var stations = {}, name;
    for (name in _coreStations) {
      if (_coreStations.hasOwnProperty(name)) {
        stations[name] = _coreStations[name];
      }
    }
    return stations;
  }

  /**
   * Get station by name.
   * @param {string} name Station name.
   * @return {?Station}
   * @public
   */
  function getStationByName(name) {
    if (_coreStations.hasOwnProperty(name)) {
      return _coreStations[name];
    }
    return null;
  }

  /**
   * Set the last played station.
   * @param {string} name Station name.
   * @public
   */
  function setLast(name) {
    _last = name;
    _save('_last', _last);
  }

  /**
   * Get the last played station name.
   * @return {string}
   * @public
   */
  function getLastName() {
    return _last;
  }

  /**
   * Get the last played station.
   * @return {Station}
   * @public
   */
  function getLastStation() {
    return getStationByName(_last);
  }

  /**
   * Get volume.
   * @return {number}
   * @public
   */
  function getVolume() {
    return parseInt(_volume.current, 10) || 0;
  }

  /**
   * Get last before current volume value.
   * @return {number}
   * @public
   */
  function getVolumeLast() {
    return parseInt(_volume.last, 10) || 80;
  }

  /**
   * Save volume value.
   * @param {number} volume Volume.
   * @public
   */
  function setVolume(volume) {
    var last = _volume.current;
    _volume = {current: volume, last: last};
    _save('_volume', JSON.stringify(_volume));
  }

  /**
   * Load core stations by url.
   * @param {string} url
   * @param {function=} onerror
   * @private
   */
  function _loadCoreStations(url, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        var json = JSON.parse(xhr.responseText);
        json.sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
        json.forEach(function(data) {
          _coreStations[data.name] = new Station(data.name, data.name, data.domen, data.frequency, data.streams, data.logo);
        });
      }
    };
    if (onerror) {
      xhr.onerror = onerror;
    }
    xhr.open('GET', url, true);
    xhr.send();
  }

  // Load core stations list
  _loadCoreStations('http://www.kp.ru/json/unisound_radioplayer/v2/data.json', function() {
    _loadCoreStations(chrome.extension.getURL('stations.json'));
  });

  /**
   * @typedef {{}} DataStorage
   */
  return {
    like: like,
    dislike: dislike,
    isFavorite: isFavorite,
    getFavorites: getFavorites,
    setFavorites: setFavorites,
    getStations: getStations,
    getStationByName: getStationByName,
    setLast: setLast,
    getLastName: getLastName,
    getLastStation: getLastStation,
    getVolume: getVolume,
    getVolumeLast: getVolumeLast,
    setVolume: setVolume
  };
});
