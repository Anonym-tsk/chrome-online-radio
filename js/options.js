(function(window, $) {
  var Options = function() {
    // TODO: Переводы
    this.Background = chrome.extension.getBackgroundPage();
    this.Storage = this.Background.Radio.Storage;
    this._port = chrome.extension.connect();

    // Open tab
    if (window.location.hash) {
      var hash = window.location.hash.substring(1);
      if (hash == 'add') {
        $('body').attr('data-page', hash);
      }
    }

    // send message to background
    this.sendMessage = function(action, data) {
      data = data || {};
      this._port.postMessage({action: action, data: data});
    };
  };

  Options.prototype = {
    _renderStation: function(name, title, image, hidden) {
      var $station = $('<div/>', {'class': 'station' + (hidden ? ' hidden' : ''), 'data-name': name});
      $('<div/>', {'class': 'image'}).css('backgroundImage', image ? 'url('+ image +')' : '').appendTo($station);
      $('<i/>', {'class': 'icon icon-delete', 'title': 'Удалить'}).appendTo($station);
      $('<i/>', {'class': 'icon icon-restore', 'title': 'Восстановить'}).appendTo($station);
      $('<h3/>', {'class': 'title', 'text': title}).appendTo($station);

      return $station;
    },

    renderStations: function() {
      var $container = $('#stations').empty();
      var stations = this.Storage.getStations();

      $.each(stations, function(name, station) {
        var rendered = this._renderStation(name, station.title, station.image, station.hidden);
        $container.append(rendered);
      }.bind(this));
    },

    initEvents: function() {
      var $page = this;

      $('ul.menu').on('click', 'li', function(e) {
        e.preventDefault();
        $('body').attr('data-page', $(this).data('page'));
      });

      $('#stations')
        .on('click', '.station > .icon-delete', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          if (confirm('Вы действительно хотите удалить станцию?')) {
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

      $('#addStation').on('submit', function(e) {
        e.preventDefault();
        var $this = $(this);
        // TODO: Рефакторить
        $page.Storage.addStation({
          title: $this.find('[name="title"]').val(),
          url: $this.find('[name="url"]').val(),
          image: $this.find('[name="image"]').val(),
          stream: $this.find('[name="stream"]').val()
        });
        $page.renderStations();
        $('body').attr('data-page', 'stations');
        // TODO: Очистить форму
      });
    }
  };

  $(function() {
    var Opened = new Options();
    Opened.renderStations();
    Opened.initEvents();
  });

})(window, jQuery);