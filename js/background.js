(function(window) {
  var Radio = function() {
    var _port = {postMessage: function(data) {}};

    this.Player = new AudioPlayer();
    this.Storage = new DataStorage();

    this.status = 'stopped';
    this._attempts = 0;
    this._port = _port;

    // Connection with popup opened (when opened popup)
    chrome.extension.onConnect.addListener(function(port) {
      if (port.hasOwnProperty('name') && port.name == 'popup') {
        this._port = port;

        // Listen messages from background
        port.onMessage.addListener(function(message) {
          switch (message.action) {
            case 'play':
              if (message.data == this.Storage.getLastName() && this.Player.isPlaying()) {
                this.Player.stop();
              }
              else {
                var station = this.Storage.getStationByName(message.data);
                this.Storage.setLast(message.data);
                this.Player.play(station.stream);
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
              var station = this.Storage.getStationByName(message.data);
              chrome.tabs.create({url: station.url});
              break;
          }
        }.bind(this));

        port.onDisconnect.addListener(function() {
          this._port = _port;
        }.bind(this));
      }
    }.bind(this));

    // Player events
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

    this.setStatus();
  };

  Radio.prototype = {
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