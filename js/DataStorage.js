(function(window) {
  var DataStorage = function() {
    this._favorites = JSON.parse(localStorage.getItem('_favorites')) || {};
    // TODO: При инициализации нужно переписывать веса, чтобы небыло бесконечного роста веса
    this._last = localStorage.getItem('_last') || '';
    this._coreStations = {};
    this._userStations = JSON.parse(localStorage.getItem('_stations')) || {};
    this._stations = {};

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
    _save: function(name, value) {
      localStorage.setItem(name, value);
    },

    _updateStationsList: function() {
      var stations = {};
      for (var i in this._coreStations) if (this._coreStations.hasOwnProperty(i)) {
        stations[i] = this._coreStations[i];
        stations[i]['type'] = 'core';
      }
      for (var i in this._userStations) if (this._userStations.hasOwnProperty(i)) {
        stations[i] = this._userStations[i];
        stations[i]['type'] = 'user';
      }
      this._stations = stations;
    },

    like: function(name) {
      var keys = Object.keys(this._favorites);
      this._favorites[name] = keys.length > 0 ? this._favorites[keys[keys.length - 1]] + 1 : 1;
      this._save('_favorites', JSON.stringify(this._favorites));
    },

    dislike: function(name) {
      if (this.isFavorite(name)) {
        delete this._favorites[name];
      }
      this._save('_favorites', JSON.stringify(this._favorites));
    },

    isFavorite: function(name) {
      return this._favorites.hasOwnProperty(name) ? this._favorites[name] : false;
    },

    getFavorites: function() {
      return this._favorites;
    },

    getStations: function() {
      return this._stations;
    },

    getStationByName: function(name) {
      if (this._stations.hasOwnProperty(name)) {
        var station = this._stations[name];
        station.name = name;
        return station
      }
      return null;
    },

    setLast: function(name) {
      this._last = name;
      this._save('_last', this._last);
    },

    getLastName: function() {
      return this._last;
    },

    getLastStation: function() {
      return this.getStationByName(this._last);
    },

    addStation: function(station) {
      var keys = Object.keys(this._userStations);
      var newKey = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
      this._userStations[newKey] = station;
      this._save('_stations', JSON.stringify(this._userStations));
      this._updateStationsList();
    },

    deleteStation: function(name) {
      if (this._userStations.hasOwnProperty(name)) {
        delete this._userStations[name];
        this._save('_stations', JSON.stringify(this._userStations));
        this._updateStationsList();
      }
    }
  };

  window.DataStorage = DataStorage;
})(window);