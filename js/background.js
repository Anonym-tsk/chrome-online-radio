require.config({
  baseUrl: 'js'
});

require(['utils/Updater', 'models/DataStorage', 'models/FlashPlayer', 'models/HtmlPlayer', 'utils/Translator'],
  function(Updater, DataStorage, FlashPlayer, HtmlPlayer, Translator) {
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
   * @type {HtmlPlayer|FlashPlayer}
   * @private
   */
  var _player = HtmlPlayer;

  /**
   * Init player events.
   */
  function initEvents() {
    _player.attachEvent('play', function() {
      setStatus(STATUS.BUFFERING);
      sendMessage(_status);
    });
    _player.attachEvent('playing', function() {
      _attempts = 0;
      setStatus(STATUS.PLAYING);
      sendMessage(_status);
    });
    _player.attachEvent('abort', function() {
      setStatus(STATUS.STOPPED);
      sendMessage(_status);
    });
    _player.attachEvent('error', function() {
      if (_status !== STATUS.STOPPED) {
        if (_attempts++ < 4) {
          _player.play();
        }
        else {
          _attempts = 0;
          setStatus(STATUS.ERROR);
          sendMessage(_status);
        }
      }
    });
  }

  function messageDispatcher(message) {
    var action, data = null, volume, volStep = 5, stations, name;
    if (typeof message == 'string') {
      action = message;
    }
    else if (!message.name || message.name != 'background') {
      return;
    }
    else {
      action = message.action;
      data = message.data;
    }

    switch (action) {
      case 'play':
        if (data == DataStorage.getLastName() && _player.isPlaying()) {
          _player.stop();
        }
        else {
          DataStorage.setLast(data);
          _player.play(DataStorage.getStationByName(data).stream);
        }
        break;

      case 'playpause':
        if (_player.isPlaying()) {
          _player.stop();
        }
        else {
          var station = DataStorage.getLastStation();
          if (!station) {
            stations = DataStorage.getStations();
            for (name in stations) if (stations.hasOwnProperty(name)) {
              DataStorage.setLast(name);
              station = stations[name];
              break;
            }
          }
          _player.play(station.stream);
        }
        break;

      case 'prev':
      case 'next':
        stations = DataStorage.getStations();
        var keys = Object.keys(stations);
        var length = keys.length;
        name = DataStorage.getLastName() || (action == 'next' ? keys[length - 1] : keys[0]);
        for (var i = 0; i < length; i++) {
          if (keys[i] == name) {
            name = (action == 'next') ? keys[(i + 1) % length] : keys[(length + i - 1) % length];
            break;
          }
        }
        DataStorage.setLast(name);
        _player.play(stations[name].stream);
        break;

      case 'volume':
        DataStorage.setVolume(data);
        _player.setVolume(data);
        break;

      case 'volumeup':
        volume = _player.getVolume();
        if (volume < 100) {
          _player.setVolume(Math.min(volume + volStep, 100));
        }
        break;

      case 'volumedown':
        volume = _player.getVolume();
        if (volume > 0) {
          _player.setVolume(Math.max(volume - volStep, 0));
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
        openOptions(data);
        break;
    }
  }

  /**
   * Send message to popup.
   * @param {string} action
   * @param {string=} data
   */
  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'popup', action: action, data: typeof data != 'undefined' ? data : null});
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
        setIconText('…', [255, 144, 0, 255]);
        chrome.browserAction.setIcon({path: {'19': 'icons/19o.png', '38': 'icons/38o.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title + ' - ' + Translator.translate('loading')});
        break;
      case 'playing':
        setIconText('►', [0, 180, 0, 255]);
        chrome.browserAction.setIcon({path: {'19': 'icons/19g.png', '38': 'icons/38g.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title});
        break;
      case 'stopped':
        setIconText();
        chrome.browserAction.setIcon({path: {'19': 'icons/19.png', '38': 'icons/38.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title + ' - ' + Translator.translate('stopped')});
        break;
      case 'error':
        setIconText();
        chrome.browserAction.setIcon({path: {'19': 'icons/19r.png', '38': 'icons/38r.png'}});
        chrome.browserAction.setTitle({title: DataStorage.getLastStation().title + ' - ' + Translator.translate('error')});
        break;
      default:
        setIconText();
        chrome.browserAction.setIcon({path: {'19': 'icons/19.png', '38': 'icons/38.png'}});
        chrome.browserAction.setTitle({title: Translator.translate('name')});
    }
  }

  /**
   * Set browser icon text and color.
   * @param {string=} text
   * @param {string|Array=} color
   */
  function setIconText(text, color) {
    text = text || '';
    color = color || [255, 79, 87, 255];
    chrome.browserAction.setBadgeBackgroundColor({color: color});
    chrome.browserAction.setBadgeText({text: text});
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
      else while (i--) {
        chrome.contextMenus.create({
          title: _foundStreams[i].title,
          contexts: contexts,
          onclick: openOptions.bind(null, 'add#' + _foundStreams[i].title + '#' + _foundStreams[i].stream + '#' + _foundStreams[i].url)
        });
      }
    });
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

  // Disable Opera offroad mode
  window.opr && opr.offroad.enabled.get({}, function(details) {
    if (details.levelOfControl === 'controllable_by_this_extension' || details.levelOfControl === 'controlled_by_this_extension') {
      if (details.value == true) {
        opr.offroad.enabled.set({'value': false}, function() {});
      }
    }
  });

  // Check updates
  Updater.checkUpdates();

  // Run!
  HtmlPlayer.canPlayMP3(function(status) {
    if (!status) {
      _player = FlashPlayer;
    }
    _player.init();

    // Listen messages from popup and options
    chrome.runtime.onMessage.addListener(messageDispatcher);

    // Hotkeys listener
    chrome.commands.onCommand.addListener(messageDispatcher);

    // Detect audio
    chrome.webRequest.onHeadersReceived.addListener(function(details) {
      var i = details.responseHeaders.length;
      while (i--) {
        if (details.responseHeaders[i].name == 'Content-Type') {
          if (details.responseHeaders[i].value == 'audio/mpeg' && details.tabId > 0) {
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
  });

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
    return _player.getAudioData();
  };

  /**
   * @public
   * @export
   */
  window.openOptions = openOptions;
});
