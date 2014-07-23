require(['utils/Translator', 'lib/jquery.min'], function(Translator) {
  'use strict';

  /**
   * Background page.
   * @type {Window}
   * @private
   */
  var _background = chrome.extension.getBackgroundPage();

  /**
   * Storage.
   * @type {DataStorage}
   * @private
   */
  var _storage = _background.Radio.getStorage();

  /**
   * Stations container.
   * @type {*}
   * @private
   */
  var $stations = $('#stations');

  /**
   * Favorites container.
   * @type {*}
   * @private
   */
  var $favorites = $('#favorites');

  /**
   * Player container
   * @type {*}
   * @private
   */
  var $player = $('#player');

  /**
   * Send message to background.
   * @param {string} action
   * @param {string=} data
   */
  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'background', action: action, data: typeof data != 'undefined' ? data : null});
  }

  /**
   * Renders adding station to favorites.
   * @param {string} name
   * @private
   */
  function renderLike(name) {
    var $station = $('.station[data-name="' + name + '"]').addClass('favorite'),
        $prev = $station.prev(),
        height = parseInt($station.outerHeight(), 10),
        top = (parseInt($station.position().top, 10) + parseInt($stations.scrollTop(), 10));

    $station.addClass('move').css({top: top + 'px'});
    $prev.css({marginBottom: height + 'px'});

    $.when(
      $stations.animate({scrollTop: 0}, {duration: 500, queue: false}),
      $favorites.animate({paddingTop: height + 'px'}, {duration: 500, queue: false}),
      $prev.animate({marginBottom: 0}, {duration: 500, queue: false}),
      $station.animate({top: 0}, {duration: 500, queue: false})
    ).then(function() {
      $favorites.css({paddingTop: 0});
      $prev.css({marginBottom: 0});
      $station.prependTo($favorites).css('top', 'auto').removeClass('move');
    });

    $player.toggleClass('favorite', $player.data('name') === name);
  }

  /**
   * Renders removing station from favorites.
   * @param {string} name
   * @private
   */
  function renderDislike(name) {
    var $station = $('.station[data-name="' + name + '"]').removeClass('favorite'),
        $next = $station.is(':last-child') ? $favorites.next('.station') : $station.next('.station'),
        height = parseInt($station.outerHeight(), 10),
        top = (parseInt($station.position().top, 10) + parseInt($stations.scrollTop(), 10)),
        newTop = (parseInt($favorites.height(), 10) - height);

    $station.addClass('move').css({top: top + 'px'});
    $next.css({marginTop: height + 'px'});

    $.when(
      $favorites.animate({paddingBottom: height + 'px'}, {duration: 500, queue: false}),
      $next.animate({marginTop: 0}, {duration: 500, queue: false}),
      $station.animate({top: newTop + 'px'}, {duration: 500, queue: false})
    ).then(function() {
      $favorites.css({paddingBottom: 0});
      $next.css({marginTop: 0});
      $station.insertAfter($favorites).css('top', 'auto').removeClass('move');
    });

    $player.toggleClass('favorite', $player.data('name') !== name);
  }

  /**
   * Renders one station for stations list.
   * @param {string} name
   * @param {string} title
   * @param {string} image
   * @return {jQuery}
   * @private
   */
  function renderStation(name, title, image) {
    var isFavorite = _storage.isFavorite(name),
        $station = $('<div/>', {'class': 'station', 'data-name': name}).toggleClass('favorite', isFavorite),
        $image = $('<div/>', {'class': 'image'}),
        $play = $('<i/>', {'class': 'icon icon-play', 'title': Translator.translate('play')}),
        $stop = $('<i/>', {'class': 'icon icon-stop', 'title': Translator.translate('stop')}),
        $title = $('<h3/>', {'class': 'title', 'text': title}),
        $like = $('<i/>', {'class': 'icon icon-like', 'title': Translator.translate('like')}),
        $dislike = $('<i/>', {'class': 'icon icon-dislike', 'title': Translator.translate('dislike')});

    setTimeout(function(src) {
      this.css('backgroundImage', src ? 'url(' + src + ')' : '');
    }.bind($image, image), 50);

    return $station.append($image, $play, $stop, $like, $dislike, $title);
  }

  /**
   * Renders visualization.
   * @private
   */
  function renderEqualizer() {
    var $container = $player.find('.equalizer');

    var BAR_WIDTH = 3, // Ширина полоски
      SPACER_WIDTH = 1, // Ширина отступа
      EMPTY_HEIGHT = 1, // Высота "пустого" бара
      CANVAS_WIDTH = parseInt($container.css('width'), 10),
      CANVAS_HEIGHT = parseInt($container.css('height'), 10),
      NUM_BARS = Math.round(CANVAS_WIDTH / (SPACER_WIDTH + BAR_WIDTH));

    // Canvas
    var canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    $container.append(canvas);

    // Canvas context
    var canvasContext = canvas.getContext('2d');
    var gradient = canvasContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(1, '#0088cc');
    gradient.addColorStop(0.5, '#00719f');
    gradient.addColorStop(0, '#005E84');
    canvasContext.fillStyle = gradient;

    // First render
    for (var i = 0; i < NUM_BARS; ++i) {
      canvasContext.fillRect(
        i * (SPACER_WIDTH + BAR_WIDTH),
        CANVAS_HEIGHT,
        BAR_WIDTH,
        -EMPTY_HEIGHT
      );
    }

    (function drawFrame() {
      var freqByteData = _background.Radio.getAudioData();
      canvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - EMPTY_HEIGHT);

      for (var i = 0; i < NUM_BARS; ++i) {
        var magnitude = Math.ceil(freqByteData[i] * CANVAS_HEIGHT / 255); // 255 is the maximum magnitude of a value in the frequency data
        canvasContext.fillRect(
          i * (SPACER_WIDTH + BAR_WIDTH),
          CANVAS_HEIGHT,
          BAR_WIDTH,
          -magnitude
        );
      }

      requestAnimationFrame(drawFrame, canvas);
    })();
  }

  /**
   * Set volume.
   * @param {number} volume
   * @param {boolean=} setInputValue
   * @param {boolean=} renderOnly
   * @private
   */
  function setVolume(volume, setInputValue, renderOnly) {
    var $mute = $player.find('.icon-mute').show();
    var $unmute = $player.find('.icon-unmute').hide();

    volume = volume < 0 ? 0 : Math.min(volume, 100);

    if (!volume) {
      $mute.hide();
      $unmute.show();
    }
    if (setInputValue) {
      $player.find('.volume > input').val(volume);
    }
    if (!renderOnly) {
      sendMessage('volume', volume);
    }
  }

  /**
   * Renders stations list.
   * @private
   */
  function renderStationsList() {
    var stations = _storage.getStations(),
        favorites = _storage.getFavorites();

    $.each(favorites, function(name) {
      if (stations.hasOwnProperty(name) && !stations[name].hidden) {
        var rendered = renderStation(name, stations[name].title, stations[name].image);
        $favorites.prepend(rendered);
      }
    });

    $.each(stations, function(name, station) {
      if (!favorites.hasOwnProperty(name) && !station.hidden) {
        var rendered = renderStation(name, station.title, station.image);
        $stations.append(rendered);
      }
    });
  }

  /**
   * Init events.
   */
  function initEvents() {
    $stations
      .on('click', '.station', function(e) {
        e.preventDefault();
        sendMessage('play', $(this).data('name'));
      })
      .on('click', '.icon-like', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var name = $(this).parents('.station:first').data('name');
        sendMessage('like', name);
        renderLike(name);
      })
      .on('click', '.icon-dislike', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var name = $(this).parents('.station:first').data('name');
        sendMessage('dislike', name);
        renderDislike(name);
      });

    $player
      .on('click', '.link', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sendMessage('link', $player.data('name'));
      })
      .on('click', '.icon-like', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var name = $player.data('name');
        sendMessage('like', name);
        renderLike(name);
      })
      .on('click', '.icon-dislike', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var name = $player.data('name');
        sendMessage('dislike', name);
        renderDislike(name);
      })
      .on('change input', '.volume > input', function(e) {
        e.preventDefault();
        e.stopPropagation();
        setVolume(e.target.value);
      })
      .on('click', '.icon-mute', function(e) {
        e.preventDefault();
        e.stopPropagation();
        setVolume(0, true);
      })
      .on('click', '.icon-unmute', function(e) {
        e.preventDefault();
        e.stopPropagation();
        setVolume(_storage.getVolumeLast(), true);
      })
      .on('mousewheel', function(e) {
        e.preventDefault();
        var volume = _storage.getVolume(), step = 5, delta = e.originalEvent.wheelDelta;
        if (delta > 0 && volume < 100) {
          setVolume(volume + step, true);
        }
        else if (delta < 0 && volume > 0) {
          setVolume(volume - step, true);
        }
      })
      .on('click', '.icon-play-big, .icon-stop-big', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sendMessage('play', $player.data('name'));
      });

    $('#footer')
      .on('click', '.icon-options', function(e) {
        e.preventDefault();
        sendMessage('options');
      })
      .on('click', '.icon-add', function(e) {
        e.preventDefault();
        sendMessage('options', 'add');
      })
      .on('click', '.icon-feedback', function(e) {
        e.preventDefault();
        chrome.tabs.create({url: 'mailto:chrome@css3.su?Subject=Online%20Radio%20Extension'});
      });
  }

  /**
   * Set player state.
   * @param {string=} state
   */
  function setPlayerState(state) {
    state = state || _background.Radio.getStatus();
    var start = function() {
      stop();
      var station = _storage.getLastStation();
      if (!station) {
        return;
      }

      var $station = $('.station[data-name="' + station.name + '"]').addClass('active'),
          $description = $player.find('.description').empty();

      $player.addClass('buffering ready').toggleClass('favorite', $station.hasClass('favorite')).data('name', station.name);
      $player.find('.title').text(station.title);

      setTimeout(function(image) {
        this.css('backgroundImage', image ? 'url(' + image + ')' : '');
      }.bind($player.find('.image'), station.image), 50);

      if (station.url) {
        var linkText = station.url.match(/^[a-z]+:\/\/([^/^?^&^#]+)/);
        linkText = linkText && linkText[1] ? linkText[1] : station.url;
        var $link = $('<span/>', {'class': 'link', 'text': linkText, 'title': Translator.translate('link')});
        $description.append($link);
      }
    };

    var error = function() {
      stop();
      $player.addClass('error');
    };

    var stop = function() {
      $('.active').removeClass('active');
      $player.removeClass('buffering playing error');
    };

    var play = function() {
      $player.removeClass('buffering error').addClass('playing');
    };

    if (!$player.hasClass('ready') && state != 'buffering') {
      start();
    }

    switch (state) {
      case 'buffering':
        start();
        break;
      case 'playing':
        play();
        break;
      case 'stopped':
        stop();
        break;
      case 'error':
        error();
        break;
    }
  }

  // Listen messages from background
  chrome.runtime.onMessage.addListener(function(message) {
    if (!message.name || message.name != 'popup') {
      return;
    }
    setPlayerState(message.action);
  });

  Translator.translateAll();
  renderStationsList();
  initEvents();
  setVolume(_storage.getVolume(), true, true);
  renderEqualizer();
  setPlayerState();
});
