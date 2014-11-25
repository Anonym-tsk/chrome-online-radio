define(['models/DataStorage'], function(DataStorage) {
  'use strict';

  /**
   * Update functions.
   * @private
   */
  var updates = {
    '1.7.0': function() {
      // Удаляем старые хоткеи, будем использовать системные
      localStorage.removeItem('_hotkeys');
    },
    '1.7.2': function() {
      // Сделаем из объекта массив
      var favorites = DataStorage.getFavorites(), newFavorites = [];
      for (var name in favorites) {
        if (favorites.hasOwnProperty(name)) {
          newFavorites.push(name);
        }
      }
      DataStorage.setFavorites(newFavorites);
    },
    '1.7.7': function() {
      var json = JSON.parse(localStorage.getItem('_stations')) || {};
      for (var name in json) {
        if (json.hasOwnProperty(name)) {
          var station = json[name];
          station.name = name;
          station.streams = [json[name].stream];
          DataStorage.addStation(station);
        }
      }
    },
    '2.0.0': function() {
      localStorage.removeItem('_version');
    },
    '2.0.4': function() {
      // Now it's user's station
      DataStorage.addStation({
        name: 'chillout.101.ru',
        title: '101.ru ● Chillоut',
        url: 'http://chillout.101.ru/',
        streams: [
          'http://eu4.101.ru:8000/c15_3',
          'http://ru2.101.ru:8000/c15_3',
          'http://eu7.101.ru:8000/c15_3',
          'http://nbn.101.ru:8000/c15_3',
          'http://ru1.101.ru:8000/c15_3'
        ],
        image: 'http://101.ru/vardata/modules/channel/dynamics/pro/24.jpg'
      });
    }
  };

  /**
   * Check updates and run callbacks.
   * @param {{previousVersion: string, reason: string}} details
   */
  function checkUpdates(details) {
    var previousVersion = details.previousVersion,
        currentVersion = chrome.runtime.getManifest().version;

    if (previousVersion && currentVersion > previousVersion) {
      for (var version in updates) {
        if (updates.hasOwnProperty(version)) {
          if (version > previousVersion && version <= currentVersion) {
            updates[version].call();
            console.info('Update ' + version + ' installed');
          }
        }
      }
    }
  }

  /**
   * Open options page.
   * @param {string} page
   */
  function openOptions(page) {
    var optionsUrl = chrome.runtime.getURL('options.html');
    var fullUrl = (typeof page === 'string') ? optionsUrl + '#' + page : optionsUrl;
    chrome.tabs.query({url: optionsUrl}, function(tabs) {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, {active: true, url: fullUrl});
        chrome.tabs.reload(tabs[0].id);
      }
      else {
        chrome.tabs.create({url: fullUrl});
      }
    });
  }

  /**
   * @typedef {{}} Utils
   */
  return {
    checkUpdates: checkUpdates,
    openOptions: openOptions
  };
});
