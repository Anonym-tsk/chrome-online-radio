(function(window) {
  'use strict';

  var Radio = function() {
    var EMPTY_PORT = {postMessage: function(data) {}};

    this.Storage = new DataStorage();
    this.Player = new AudioPlayer(this.Storage.getVolume());

    this.status = 'stopped';
    this._attempts = 0;
    this._port = EMPTY_PORT;

    // Connection with popup opened (when opened popup)
    chrome.extension.onConnect.addListener(function(port) {
      if (!port.hasOwnProperty('name')) {
        return;
      }

      var portListener = function(message) {
        console.log('Message to bg port', message);
        var volume, volStep = 5;

        switch (message.action) {
          case 'play':
            if (message.data == this.Storage.getLastName() && this.Player.isPlaying()) {
              this.Player.stop();
            }
            else {
              this.Storage.setLast(message.data);
              this.Player.play(this.Storage.getStationByName(message.data).stream);
            }
            break;

          case 'playpause':
            if (this.Player.isPlaying()) {
              this.Player.stop();
            }
            else {
              this.Player.play(this.Storage.getLastStation().stream);
            }
            break;

          case 'prev':
          case 'next':
            var stations = this.Storage.getStations();
            var current = this.Storage.getLastName();
            var keys = Object.keys(stations);
            for (var i = 0, l = keys.length; i < l; i++) {
              if (keys[i] == current) {
                var length = keys.length;
                var name = (message.action == 'next') ? keys[(i + 1) % length] : keys[(length + i - 1) % length];
                console.warn(name);
                this.Storage.setLast(name);
                this.Player.play(stations[name].stream);
                break;
              }
            }
            break;

          case 'volume':
            this.Storage.setVolume(message.data);
            this.Player.setVolume(message.data);
            break;

          case 'volumeup':
            volume = this.Player.getVolume();
            if (volume < 100) {
              this.Player.setVolume(Math.min(volume + volStep, 100));
            }
            break;

          case 'volumedown':
            volume = this.Player.getVolume();
            if (volume > 0) {
              this.Player.setVolume(Math.max(volume - volStep, 0));
            }
            break;

          case 'like':
            if (this.Storage.isFavorite(message.data)) {
              this.Storage.dislike(message.data);
            }
            else {
              this.Storage.like(message.data);
            }
            break;

          case 'link':
            chrome.tabs.create({url: this.Storage.getStationByName(message.data).url});
            break;

          case 'options':
            this.openOptions(message.data);
            break;
        }
      }.bind(this);

      if (port.name == 'hotkey') {
        port.postMessage(this.Storage.getHotkeys());
        port.onMessage.addListener(portListener);
      }
      else if (port.name == 'popup') {
        this._port = port;
        port.onMessage.addListener(portListener);
        port.onDisconnect.addListener(function() {
          this._port = EMPTY_PORT;
        }.bind(this));
      }
    }.bind(this));

    this.initEvents();
    this.setStatus();
  };

  Radio.prototype = {
    initEvents: function() {
      this.Player.bind('play', function() {
        this.setStatus('buffering');
        this.sendMessage(this.status);
      }, this);
      this.Player.bind('playing', function() {
        this._attempts = 0;
        this.setStatus('playing');
        this.sendMessage(this.status);
      }, this);
      this.Player.bind('abort', function() {
        this.setStatus('stopped');
        this.sendMessage(this.status);
      }, this);
      this.Player.bind('error', function() {
        if (this.status !== 'stopped') {
          if (this._attempts++ < 4) {
            this.Player.play();
          }
          else {
            this._attempts = 0;
            this.setStatus('error');
            this.sendMessage(this.status);
          }
        }
      }, this);
    },

    openOptions: function(page) {
      var optionsUrl = chrome.extension.getURL('options.html');
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
    },

    setIconText: function(text, color) {
      text = text || '';
      color = color || [255, 79, 87, 255];
      chrome.browserAction.setBadgeBackgroundColor({color: color});
      chrome.browserAction.setBadgeText({text: text});
    },

    setStatus: function(status) {
      this.status = status || 'stopped';

      switch (status) {
        case 'buffering':
          this.setIconText('…', [255, 144, 0, 255]);
          chrome.browserAction.setIcon({path: {'19': 'icons/19o.png', '38': 'icons/38o.png'}});
          chrome.browserAction.setTitle({title: this.Storage.getLastStation().title + ' - ' + chrome.i18n.getMessage('loading')});
          break;
        case 'playing':
          this.setIconText('►', [0, 180, 0, 255]);
          chrome.browserAction.setIcon({path: {'19': 'icons/19g.png', '38': 'icons/38g.png'}});
          chrome.browserAction.setTitle({title: this.Storage.getLastStation().title});
          break;
        case 'stopped':
          this.setIconText();
          chrome.browserAction.setIcon({path: {'19': 'icons/19.png', '38': 'icons/38.png'}});
          chrome.browserAction.setTitle({title: this.Storage.getLastStation().title + ' - ' + chrome.i18n.getMessage('stopped')});
          break;
        case 'error':
          this.setIconText();
          chrome.browserAction.setIcon({path: {'19': 'icons/19r.png', '38': 'icons/38r.png'}});
          chrome.browserAction.setTitle({title: this.Storage.getLastStation().title + ' - ' + chrome.i18n.getMessage('error')});
          break;
        default:
          this.setIconText();
          chrome.browserAction.setIcon({path: {'19': 'icons/19.png', '38': 'icons/38.png'}});
          chrome.browserAction.setTitle({title: chrome.i18n.getMessage('name')});
      }
    },

    sendMessage: function(action, data) {
      data = data || {};
      this._port.postMessage({action: action, data: data});
    }
  };

  window.Radio = new Radio();
})(window);