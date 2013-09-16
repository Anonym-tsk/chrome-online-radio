(function(window, $) {
  var Popup = function() {
    this.Background = chrome.extension.getBackgroundPage();
    this.Storage = this.Background.Radio.Storage;
    this._port  = chrome.extension.connect({name: 'popup'});

    // send message to background
    this.sendMessage = function(action, data) {
      if (typeof data == 'undefined') data = {};
      this._port.postMessage({action: action, data: data});
    };

    // Listen messages from background
    this._port.onMessage.addListener(function(message) {
      switch (message.action) {
        case 'buffering':
          this.start();
          break;
        case 'playing':
          this.play();
          break;
        case 'stopped':
          this.stop();
          break;
        case 'error':
          this.error();
          break;
      }
    }.bind(this));
  };

  Popup.prototype = {
    start: function() {
      this.stop();
      var station = this.Storage.getLastStation();
      if (station) {
        var $station = $('.station[data-name="'+ station.name +'"]').addClass('active');
        var $player = $('#player').addClass('buffering').data('name', station.name);
        if ($station.hasClass('favorite')) {
          $player.addClass('favorite');
        }
        else {
          $player.removeClass('favorite');
        }

        setTimeout(function() {
          this.element.css('backgroundImage', this.image ? 'url('+ this.image +')' : '');
        }.bind({element: $player.find('.image'), image: station.image}), 50);
        $player.find('.title').text(station.title);
        var linkText = station.url.match(/^[a-z]+:\/\/([^/^?^&^#]+)/);
        linkText = linkText && linkText[1] ? linkText[1] : station.url;
        var $link = $('<span/>', {'class': 'link', 'text': linkText, 'title': chrome.i18n.getMessage('link')});
        $player.find('.description').html($link);
        $player.find('.volume > input').val(this.Background.Radio.Player.getVolume());
        $player.addClass('ready');
      }
    },

    play: function() {
      $('#player')
        .removeClass('buffering')
        .removeClass('error')
        .addClass('playing');
    },

    stop: function() {
      $('.active').removeClass('active');
      $('#player')
        .removeClass('buffering')
        .removeClass('playing')
        .removeClass('error');
    },

    error: function() {
      this.stop();
      $('#player').addClass('error');
    },

    like: function(name) {
      var $fContainer = $('#favorites'),
          $station = $('.station[data-name="'+ name +'"]').addClass('favorite'),
          $prev = $station.prev(),
          $player = $('#player'),
          $stations = $('#stations');

      var top = (parseInt($station.position().top) + parseInt($stations.scrollTop())) + 'px';
      $station.addClass('move').css({top: top});
      $prev.css({marginBottom: '49px'});
      $.when(
        $stations.animate({scrollTop: 0}, {duration: 500, queue: false}),
        $fContainer.animate({paddingTop: '49px'}, {duration: 500, queue: false}),
        $prev.animate({marginBottom: 0}, {duration: 500, queue: false}),
        $station.animate({top: 0}, {duration: 500, queue: false})
      ).then(function() {
        $fContainer.css({paddingTop: 0});
        $prev.css({marginBottom: 0});
        $station.prependTo($fContainer).css('top', 'auto').removeClass('move');
      });

      if ($player.data('name') === name) {
        $player.addClass('favorite');
      }
    },

    dislike: function(name) {
      var $fContainer = $('#favorites'),
          $station = $('.station[data-name="'+ name +'"]').removeClass('favorite'),
          $next = $station.is(':last-child') ? $fContainer.next('.station') : $station.next('.station'),
          $player = $('#player'),
          $stations = $('#stations');

      var top = (parseInt($station.position().top) + parseInt($stations.scrollTop())) + 'px';
      var newTop = (parseInt($fContainer.height()) - 49) + 'px';
      $station.addClass('move').css({top: top});
      $next.css({marginTop: '49px'});
      $.when(
          $fContainer.animate({paddingBottom: '49px'}, {duration: 500, queue: false}),
          $next.animate({marginTop: 0}, {duration: 500, queue: false}),
          $station.animate({top: newTop}, {duration: 500, queue: false})
        ).then(function() {
          $fContainer.css({paddingBottom: 0});
          $next.css({marginTop: 0});
          $station.insertAfter($fContainer).css('top', 'auto').removeClass('move');
        });

      if ($player.data('name') === name) {
        $player.removeClass('favorite');
      }
    },

    _renderStation: function(name, title, image) {
      var isFavorite = this.Storage.isFavorite(name);

      var $station = $('<div/>', {'class': 'station', 'data-name': name}),
          $image = $('<div/>', {'class': 'image'}),
          $play = $('<i/>', {'class': 'icon icon-play', 'title': chrome.i18n.getMessage('play')}),
          $stop = $('<i/>', {'class': 'icon icon-stop', 'title': chrome.i18n.getMessage('stop')}),
          $title = $('<h3/>', {'class': 'title', 'text': title}),
          $like = $('<i/>', {'class': 'icon icon-like', 'title': chrome.i18n.getMessage('like')}),
          $dislike = $('<i/>', {'class': 'icon icon-dislike', 'title': chrome.i18n.getMessage('dislike')});

      if (isFavorite) {
        $station.addClass('favorite');
      }

      setTimeout(function() {
        this.element.css('backgroundImage', this.image ? 'url('+ this.image +')' : '');
      }.bind({element: $image, image: image}), 50);

      $station
        .append($image)
        .append($play)
        .append($stop)
        .append($like)
        .append($dislike)
        .append($title);

      return $station;
    },

    initEvents: function() {
      var $popup = this;
      $('.station')
        .on('click', function(e) {
          e.preventDefault();
          var name = $(this).data('name');
          $popup.sendMessage('play', name);
        })
        .on('click', '.icon-like, .icon-dislike', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          var name = $this.parents('.station:first').data('name');
          $popup.sendMessage('like', name);
          if ($this.hasClass('icon-dislike')) {
            $popup.dislike(name);
          }
          else {
            $popup.like(name);
          }
        });
      $('#player')
        .on('click', '.link', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var name = $(this).parents('#player').data('name');
          $popup.sendMessage('link', name);
        })
        .on('click', '.icon-like, .icon-dislike', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          var name = $this.parents('#player').data('name');
          $popup.sendMessage('like', name);
          if ($this.hasClass('icon-dislike')) {
            $popup.dislike(name);
          }
          else {
            $popup.like(name);
          }
        })
        .on('change', '.volume > input', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $popup.sendMessage('volume', e.target.value);
        })
        .on('click', '.icon-mute, .icon-unmute', function(e) {
          // TODO: Устанавливать нужную иконку при открытии и при перемещении ползунка
          e.preventDefault();
          e.stopPropagation();
          $popup.sendMessage('volume', 0);
        })
        .on('click', '.icon-play-big, .icon-stop-big', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var name = $(this).parents('#player').data('name');
          $popup.sendMessage('play', name);
        });
      $('#footer')
        .on('click', '.icon-options', function(e) {
          e.preventDefault();
          $popup.sendMessage('options');
        })
        .on('click', '.icon-add', function(e) {
          e.preventDefault();
          $popup.sendMessage('options', 'add');
        })
        .on('click', '.icon-feedback', function(e) {
          e.preventDefault();
          // Send mail
          chrome.tabs.create({url: 'mailto:chrome@css3.su?Subject=Online%20Radio%20Extension'});
        });
    },

    renderList: function() {
      var $container = $('#stations');
      var $fContainer = $('#favorites');
      var stations = this.Storage.getStations();
      var favorites = this.Storage.getFavorites();

      $.each(favorites, function(name, weight) {
        if (stations.hasOwnProperty(name) && !stations[name].hidden) {
          var rendered = this._renderStation(name, stations[name].title, stations[name].image);
          $fContainer.prepend(rendered);
        }
        else {
          this.sendMessage('like', name);
        }
      }.bind(this));

      $.each(stations, function(name, station) {
        if (!favorites.hasOwnProperty(name) && !station.hidden) {
          var rendered = this._renderStation(name, station.title, station.image);
          $container.append(rendered);
        }
      }.bind(this));
    },

    init: function() {
      switch (this.Background.Radio.status) {
        case 'buffering':
          this.start();
          break;
        case 'playing':
          this.start();
          this.play();
          break;
        case 'stopped':
          this.start();
          this.stop();
          break;
        case 'error':
          this.start();
          this.error();
          break;
      }
    }
  };

  $(function() {
    var Opened = new Popup();
    Opened.renderList();
    Opened.initEvents();
    Opened.init();
  });
})(window, jQuery);