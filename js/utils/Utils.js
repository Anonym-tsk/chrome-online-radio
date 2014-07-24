define(['models/DataStorage', 'utils/Translator'], function(DataStorage, Translator) {
  'use strict';

  /**
   * Update functions.
   * @private
   */
  var updates = {
    '1.7.0': function() {
      localStorage.removeItem('_hotkeys');
    }
  };

  /**
   * Check updates and run callbacks.
   */
  function checkUpdates() {
    var previousVersion = DataStorage.getVersion(),
      currentVersion = chrome.runtime.getManifest().version;

    if (currentVersion > previousVersion) {
      for (var version in updates) if (updates.hasOwnProperty(version)) {
        if (version > previousVersion && version <= currentVersion) {
          updates[version].call();
          console.info('Update ' + version + ' installed');
        }
      }
      DataStorage.setVersion(currentVersion);
    }
  }

  /**
   * Show notification.
   * @param {string} message
   * @param {function=} callback
   */
  function showNotification(message, callback) {
    chrome.notifications.create('radio_online', {
      title: Translator.translate('name'),
      iconUrl: chrome.extension.getURL('icons/80.png'),
      type: 'basic',
      message: message
    }, callback || (function() {}));
  }

  /**
   * Open options page.
   * @param {string} page
   */
  function openOptions(page) {
    var optionsUrl = chrome.runtime.getURL('options.html');
    var fullUrl = (typeof page == 'string') ? optionsUrl + '#' + page : optionsUrl;
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
    showNotification: showNotification,
    openOptions: openOptions
  };
});
