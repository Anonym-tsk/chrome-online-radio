(function(window, $) {
  'use strict';

  var sysCodeMap = {
    16: 'Shift', 17: 'Ctrl', 18: 'Alt'
  };
  var keyCodeMap = {
    8: 'Backspace', 9: 'Tab', 13: 'Return', 32: 'Space', 33: 'PageUp', 34: 'PageDown', 35: 'End', 36: 'Home',
    37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down', 43: '+', 45: 'Insert', 46: 'Delete',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    96: '0', 97: '1', 98: '2', 99: '3', 100: '4', 101: '5', 102: '6', 103: '7', 104: '8', 105: '9',
    65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M',
    78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z',
    59: ';', 61: '=', 106: '*', 107: '+', 109: '-', 110: '.', 111: '/', 186: ';', 187: '=',
    188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: '\''
  };

  var _renderStation = function(name, station) {
    var $station = $('<div/>', {'class': 'station' + (station.hidden ? ' hidden' : ''), 'data-name': name, 'data-type': station.type});
    $('<div/>', {'class': 'image'}).css('backgroundImage', station.image ? 'url('+ station.image +')' : '').appendTo($station);
    $('<i/>', {'class': 'icon icon-delete', 'title': chrome.i18n.getMessage('delete')}).appendTo($station);
    $('<i/>', {'class': 'icon icon-restore', 'title': chrome.i18n.getMessage('restore')}).appendTo($station);
    if (station.type !== 'core') {
      $('<i/>', {'class': 'icon icon-edit', 'title': chrome.i18n.getMessage('edit')}).appendTo($station);
    }
    $('<h3/>', {'class': 'title', 'text': station.title}).appendTo($station);

    return $station;
  };

  var _renderHotkey = function(name, altKey, ctrlKey, shiftKey, keyCode) {
    var $item = $('.hotkey[data-hotkey="' + name + '"]');
    var $value = $item.find('.hotkey-value').empty();
    var $input = $item.find('.hotkey-change');
    if (+altKey) {
      $('<kbd/>', {text: sysCodeMap[18]}).appendTo($value);
      $('<span/>', {text: '+'}).appendTo($value);
      $input.data('altKey', 1);
    }
    if (+ctrlKey) {
      $('<kbd/>', {text: sysCodeMap[17]}).appendTo($value);
      $('<span/>', {text: '+'}).appendTo($value);
      $input.data('ctrlKey', 1);
    }
    if (+shiftKey) {
      $('<kbd/>', {text: sysCodeMap[16]}).appendTo($value);
      $('<span/>', {text: '+'}).appendTo($value);
      $input.data('shiftKey', 1);
    }
    if (keyCodeMap.hasOwnProperty(keyCode)) {
      $('<kbd/>', {text: keyCodeMap[keyCode]}).appendTo($value);
      $input.data('keyCode', keyCode);
    }
  };

  var Options = function() {
    this.Background = chrome.extension.getBackgroundPage();
    this.Storage = this.Background.Radio.Storage;

    // Open tab
    if (window.location.hash) {
      var hash = window.location.hash.substring(1);
      hash = hash.split('#');
      if (hash[0]) {
        $('body').attr('data-page', hash[0]);
      }
      if (hash[1] && hash[2]) {
        var $station = $('#addStation');
        $station.find('[name="title"]').val(hash[1]);
        $station.find('[name="stream"]').val(hash[2]);
      }
    }
  };

  Options.prototype = {
    renderStations: function() {
      var $container = $('#stations').empty();
      var stations = this.Storage.getStations();

      $.each(stations, function(name, station) {
        var rendered = _renderStation(name, station);
        $container.append(rendered);
      }.bind(this));
    },

    renderHotkeys: function() {
      var hotkeys = this.Storage.getHotkeys();
      for (var i in hotkeys) if (hotkeys.hasOwnProperty(i)) {
        _renderHotkey(i, hotkeys[i].altKey, hotkeys[i].ctrlKey, hotkeys[i].shiftKey, hotkeys[i].keyCode);
      }
    },

    initEvents: function() {
      var $page = this;

      $('ul.menu').on('click', 'li', function(e) {
        e.preventDefault();
        $('body').attr('data-page', $(this).data('page'));
      });

      $('#stations')
        .on('click', '.station > .icon-edit', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station');
          if ($station.hasClass('edit')) {
            $station.find('.addStation').remove();
            $station.removeClass('edit');
            return;
          }

          var name = $station.data('name'),
              station = $page.Storage.getStationByName(name);

          var $form = $('#addStation').clone().removeAttr('id').data('name', name);
          $form.find('[name="title"]').val(station.title);
          $form.find('[name="url"]').val(station.url || '');
          $form.find('[name="image"]').val(station.image || '');
          $form.find('[name="stream"]').val(station.stream);
          $form.find('[type="submit"]').val(chrome.i18n.getMessage('save'));
          $station.addClass('edit').append($form);
        })
        .on('click', '.station > .icon-delete', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          if (confirm(chrome.i18n.getMessage('reallyDelete'))) {
            $page.Storage.deleteStation(name);
            $page.renderStations();
          }
        })
        .on('click', '.station > .icon-restore', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          $page.Storage.restoreStation(name);
          $page.renderStations();
        });

      $(document).on('submit', '.addStation', function(e) {
        e.preventDefault();
        var $this = $(this);
        $page.Storage.addStation({
          title: $this.find('[name="title"]').val(),
          url: $this.find('[name="url"]').val(),
          image: $this.find('[name="image"]').val(),
          stream: $this.find('[name="stream"]').val()
        }, $this.data('name'));
        $page.renderStations();
        $('body').attr('data-page', 'stations');
        $this.get(0).reset();
      });

      $('.hotkey-change')
        .on('focus', function(e) {
          e.preventDefault();
          var $this = $(this);
          var $hotkey = $this.parent('.hotkey').addClass('active');
          var name = $hotkey.data('hotkey');
          var data = $this.data();
          $this.data({
            altKeyOld: data['altKey'],
            altKey: 0,
            ctrlKeyOld: data['ctrlKey'],
            ctrlKey: 0,
            shiftKeyOld: data['shiftKey'],
            shiftKey: 0,
            keyCodeOld: data['keyCode'],
            keyCode: ''
          });
          _renderHotkey(name, false, false, false);
        })
        .on('keyup', function(e) {
          e.preventDefault();
          $(this).blur();
        })
        .on('keydown', function(e) {
          e.preventDefault();
          if (sysCodeMap.hasOwnProperty(e.which) || keyCodeMap.hasOwnProperty(e.which)) {
            _renderHotkey($(this).parent('.hotkey').data('hotkey'), e.altKey, e.ctrlKey, e.shiftKey, e.which);
          }
        })
        .on('blur', function(e) {
          e.preventDefault();
          var $this = $(this);
          var $hotkey = $this.parent('.hotkey').removeClass('active');
          var name = $hotkey.data('hotkey');
          if (!$this.data('keyCode')) {
            _renderHotkey(name, $this.data('altKeyOld'), $this.data('ctrlKeyOld'), $this.data('shiftKeyOld'), $this.data('keyCodeOld'));
          }
          $page.Storage.setHotkey(name, $this.data('altKey'), $this.data('ctrlKey'), $this.data('shiftKey'), $this.data('keyCode'));
        });
    }
  };

  $(function() {
    var Opened = new Options();
    Opened.renderStations();
    Opened.renderHotkeys();
    Opened.initEvents();
  });
})(window, jQuery);