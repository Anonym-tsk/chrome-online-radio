require.config({
  baseUrl: 'scripts',
  paths: {
    jquery: 'lib/jquery.min'
  },
  waitSeconds: 0
});

// Check updates.
chrome.runtime.onInstalled.addListener(function(details) {
  'use strict';
  require(['utils/Utils'], function(Utils) {
    Utils.checkUpdates(details);
  });
});

require([
    'utils/Utils', 'models/DataStorage', 'models/HtmlPlayer', 'utils/Translator'
], function(Utils, DataStorage, HtmlPlayer, Translator) {
  'use strict';

  /**
   * Statuses.
   * @const
   * @type {{BUFFERING: string, PLAYING: string, STOPPED: string, ERROR: string}}
   */
  var STATUS = {
    BUFFERING: 'buffering',
    PLAYING: 'playing',
    STOPPED: 'stopped',
    ERROR: 'error'
  };

  /**
   * Current status.
   * @type {string}
   * @private
   */
  var _status = STATUS.STOPPED;

  /**
   * Retry on error counter.
   * @type {number}
   * @private
   */
  var _attempts = 0;

  /**
   * Found streams on page.
   * @type {Array}
   * @private
   */
  var _foundStreams = [];

  /**
   * Init player events.
   */
  function initEvents() {
    HtmlPlayer.attachEvent('play', function() {
      setStatus(STATUS.BUFFERING);
      sendMessage(_status);
    });
    HtmlPlayer.attachEvent('playing', function() {
      _attempts = 0;
      setStatus(STATUS.PLAYING);
      sendMessage(_status);
    });
    HtmlPlayer.attachEvent('abort', function() {
      setStatus(STATUS.STOPPED);
      sendMessage(_status);
    });
    HtmlPlayer.attachEvent('error', function() {
      if (_status === STATUS.STOPPED) {
        return;
      }

      if (_attempts++ < 10) {
        var station = DataStorage.getLastStation();
        HtmlPlayer.play(station ? station.getNextStream() : null);
      }
      else {
        _attempts = 0;
        setStatus(STATUS.ERROR);
        sendMessage(_status);
      }
    });
  }

  /**
   * Message dispatcher.
   * @param {{}|string} message
   */
  function messageDispatcher(message) {
    var action, data = null, volume, volStep = 5, stations, station, name;
    if (typeof message === 'string') {
      action = message;
    } else if (!message.name || message.name !== 'background') {
      return;
    } else {
      action = message.action;
      data = message.data;
    }

    switch (action) {
      case 'play':
        if (data === DataStorage.getLastName() && HtmlPlayer.isPlaying()) {
          HtmlPlayer.stop();
        }
        else {
          DataStorage.setLast(data);
          HtmlPlayer.play(DataStorage.getStationByName(data).getStream());
        }
        break;

      case 'playpause':
        if (HtmlPlayer.isPlaying()) {
          HtmlPlayer.stop();
        }
        else {
          station = DataStorage.getLastStation();
          if (!station) {
            stations = DataStorage.getStations();
            for (name in stations) {
              if (stations.hasOwnProperty(name)) {
                DataStorage.setLast(name);
                station = stations[name];
                break;
              }
            }
          }
          HtmlPlayer.play(station.getStream());
        }
        break;

      case 'prev':
      case 'next':
        stations = DataStorage.getStations();
        var keys = Object.keys(stations);
        var length = keys.length;
        name = DataStorage.getLastName() || (action === 'next' ? keys[length - 1] : keys[0]);
        for (var i = 0; i < length; i++) {
          if (keys[i] === name) {
            name = (action === 'next') ? keys[(i + 1) % length] : keys[(length + i - 1) % length];
            break;
          }
        }
        DataStorage.setLast(name);
        HtmlPlayer.play(stations[name].getStream());
        break;

      case 'volume':
        DataStorage.setVolume(data);
        HtmlPlayer.setVolume(data);
        break;

      case 'volumeup':
        volume = HtmlPlayer.getVolume();
        if (volume < 100) {
          HtmlPlayer.setVolume(Math.min(volume + volStep, 100));
        }
        break;

      case 'volumedown':
        volume = HtmlPlayer.getVolume();
        if (volume > 0) {
          HtmlPlayer.setVolume(Math.max(volume - volStep, 0));
        }
        break;

      case 'like':
        DataStorage.like(data);
        break;

      case 'dislike':
        DataStorage.dislike(data);
        break;

      case 'link':
        chrome.tabs.create({url: DataStorage.getStationByName(data).url});
        break;

      case 'options':
        Utils.openOptions(data);
        break;

      case 'add':
        station = DataStorage.addStation(data);
        DataStorage.setLast(station.name);
        HtmlPlayer.play(station.getStream());
        window.alert(station.title + '\n' + Translator.translate('added'));
        break;

      case 'stream':
        station = DataStorage.getLastStation();
        HtmlPlayer.play(station.getStream(data));
        break;
    }
  }

  /**
   * Send message to popup.
   * @param {string} action
   * @param {string=} data
   */
  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'popup', action: action, data: typeof data !== 'undefined' ? data : null});
  }

  /**
   * Save found audio stream to history.
   * @param {Object} response
   */
  function addAudioHistory(response) {
    chrome.tabs.get(response.tabId, function(tab) {
      _foundStreams.push({
        title: tab.title,
        stream: response.url,
        favicon: tab.favIconUrl,
        tabId: tab.id,
        url: tab.url
      });
      _foundStreams = _foundStreams.slice(-15, _foundStreams.length);
      updateContextMenu();
    });
  }

  /**
   * Set radio playing status.
   * @param {string=} st
   */
  function setStatus(st) {
    _status = st || STATUS.STOPPED;

    switch (st) {
      case 'buffering':
        chrome.browserAction.setIcon({path: {'19': 'images/19o.png', '38': 'images/38o.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title + ' - ' + Translator.translate('loading')});
        break;
      case 'playing':
        chrome.browserAction.setIcon({path: {'19': 'images/19g.png', '38': 'images/38g.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title});
        break;
      case 'stopped':
        chrome.browserAction.setIcon({path: {'19': 'images/19.png', '38': 'images/38.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title + ' - ' + Translator.translate('stopped')});
        break;
      case 'error':
        chrome.browserAction.setIcon({path: {'19': 'images/19r.png', '38': 'images/38r.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title + ' - ' + Translator.translate('error')});
        break;
      default:
        chrome.browserAction.setIcon({path: {'19': 'images/19.png', '38': 'images/38.png'}});
        chrome.browserAction.setTitle({title: Translator.translate('name')});
    }
  }

  /**
   * Update context menu by audio history.
   */
  function updateContextMenu() {
    chrome.contextMenus.removeAll(function() {
      var contexts = ['page', 'frame', 'selection'];
      chrome.contextMenus.create({
        title: Translator.translate('add'),
        contexts: contexts,
        enabled: false
      });
      chrome.contextMenus.create({
        type: 'separator',
        contexts: contexts
      });

      var i = _foundStreams.length;
      if (!i) {
        chrome.contextMenus.create({
          title: Translator.translate('please_enable_radio'),
          contexts: contexts,
          enabled: false,
          id: 'online_radio'
        });
      }
      else {
        while (i--) {
          chrome.contextMenus.create({
            title: _foundStreams[i].title,
            contexts: contexts,
            onclick: Utils.openOptions.bind(null, 'add#' + _foundStreams[i].title + '#' + _foundStreams[i].stream + '#' + _foundStreams[i].url)
          });
        }
      }
    });
  }

  // Run!
  HtmlPlayer.init();

  // Listen messages from popup and options
  chrome.runtime.onMessage.addListener(messageDispatcher);

  // Hotkeys listener
  chrome.commands.onCommand.addListener(messageDispatcher);

  // Detect audio
  chrome.webRequest.onHeadersReceived.addListener(function(details) {
    var i = details.responseHeaders.length;
    while (i--) {
      if (details.responseHeaders[i].name === 'Content-Type') {
        if (details.responseHeaders[i].value === 'audio/mpeg' && details.tabId > 0) {
          addAudioHistory(details);
        }
        break;
      }
    }
  }, {urls: ['http://*/*', 'https://*/*'], types: ['other', 'object']}, ['responseHeaders']);

  // Init background page
  updateContextMenu();
  initEvents();
  setStatus();

  /**
   * @public
   * @export
   * @return {string}
   */
  window.getStatus = function() {
    return _status;
  };

  /**
   * @public
   * @export
   * @return {DataStorage}
   */
  window.getStorage = function() {
    return DataStorage;
  };

  /**
   * @public
   * @export
   * @return {Uint8Array}
   */
  window.getAudioData = function() {
    return HtmlPlayer.getAudioData();
  };
});
