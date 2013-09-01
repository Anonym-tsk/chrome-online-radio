(function(window) {
  /**
   * Base storage class.
   * @constructor
   */
  var DataStorage = function() {
    this._favorites = JSON.parse(localStorage.getItem('_favorites')) || {};
    // TODO: При инициализации нужно переписывать веса, чтобы небыло бесконечного роста веса
    this._last = localStorage.getItem('_last') || '';
    this._coreStations = {};
    this._userStations = JSON.parse(localStorage.getItem('_stations')) || {};
    this._stations = {};
    this._hidden = JSON.parse(localStorage.getItem('_hidden')) || {};

    // Load stations list
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        this._coreStations = JSON.parse(xhr.responseText);
        this._updateStationsList();
      }
    }.bind(this);
    xhr.open('GET', chrome.extension.getURL('stations.json'), true);
    xhr.send();
  };

  DataStorage.prototype = {
    /**
     * Save value to localStorage.
     * @param name
     * @param value
     * @private
     */
    _save: function(name, value) {
      localStorage.setItem(name, value);
    },

    /**
     * Update stations list with core and users stations.
     * @private
     */
    _updateStationsList: function() {
      var stations = {};
      for (var i in this._coreStations) if (this._coreStations.hasOwnProperty(i)) {
        stations[i] = this._coreStations[i];
        stations[i]['type'] = 'core';
        stations[i]['hidden'] = this._hidden.hasOwnProperty(i);
      }
      for (var i in this._userStations) if (this._userStations.hasOwnProperty(i)) {
        stations[i] = this._userStations[i];
        stations[i]['type'] = 'user';
        stations[i]['hidden'] = false;
      }
      this._stations = stations;
    },

    /**
     * Add a station to favorites.
     * @param name Station name.
     */
    like: function(name) {
      var keys = Object.keys(this._favorites);
      this._favorites[name] = keys.length > 0 ? this._favorites[keys[keys.length - 1]] + 1 : 1;
      this._save('_favorites', JSON.stringify(this._favorites));
    },

    /**
     * Remove a station from favorites.
     * @param name Station name.
     */
    dislike: function(name) {
      if (this.isFavorite(name)) {
        delete this._favorites[name];
      }
      this._save('_favorites', JSON.stringify(this._favorites));
    },

    /**
     * Check station in favorites.
     * @param name Station name.
     * @returns {*}|false
     */
    isFavorite: function(name) {
      return this._favorites.hasOwnProperty(name) ? this._favorites[name] : false;
    },

    /**
     * Get names of favorites.
     * @returns {*}
     */
    getFavorites: function() {
      return this._favorites;
    },

    /**
     * Get all stations.
     * @returns {*}
     */
    getStations: function() {
      return this._stations;
    },

    /**
     * Get station by name.
     * @param name Station name.
     * @returns {*}|null
     */
    getStationByName: function(name) {
      if (this._stations.hasOwnProperty(name)) {
        var station = this._stations[name];
        station.name = name;
        return station
      }
      return null;
    },

    /**
     * Set the last played station.
     * @param name Station name.
     */
    setLast: function(name) {
      this._last = name;
      this._save('_last', this._last);
    },

    /**
     * Get the last played station name.
     * @returns string
     */
    getLastName: function() {
      return this._last;
    },

    /**
     * Get the last played station.
     * @returns {*}
     */
    getLastStation: function() {
      return this.getStationByName(this._last);
    },

    /**
     * Save users station.
     * @param station Station object.
     */
    addStation: function(station) {
      var keys = Object.keys(this._userStations);
      var newKey = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
      this._userStations[newKey] = station;
      this._save('_stations', JSON.stringify(this._userStations));
      this._updateStationsList();
    },

    /**
     * Delete users station.
     * @param name Station name.
     */
    deleteStation: function(name) {
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
    },

    /**
     * Restore deleted core station.
     * @param name Station name.
     */
    restoreStation: function(name) {
      if (this._hidden.hasOwnProperty(name)) {
        delete this._hidden[name];
        this._save('_hidden', JSON.stringify(this._hidden));
        this._updateStationsList();
      }
    }
  };

  window.DataStorage = DataStorage;
})(window);