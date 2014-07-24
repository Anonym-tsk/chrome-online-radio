define(['models/DataStorage'], function(DataStorage) {
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
   * @typedef {{}} Updater
   */
  return {
    checkUpdates: checkUpdates
  };
});
