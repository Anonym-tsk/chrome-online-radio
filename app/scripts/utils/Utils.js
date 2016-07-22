define(function() {
  'use strict';

  /**
   * Update functions.
   * @private
   */
  var updates = {
    '1.0.0': function() {
      // Do nothing
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

      openOptions('changelog');
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
