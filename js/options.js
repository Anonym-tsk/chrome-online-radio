(function(window, $) {
  var Options = function() {
    this.Background = chrome.extension.getBackgroundPage();
    this.Storage = this.Background.Radio.Storage;
    this._port = chrome.extension.connect();

    // send message to background
    this.sendMessage = function(action, data) {
      data = data || {};
      this._port.postMessage({action: action, data: data});
    };
  };

  Options.prototype = {
    _renderStation: function(name, title, image) {
      var $station = $('<div/>', {'class': 'station', 'data-name': name});
      $('<div/>', {'class': 'image'}).css('backgroundImage', image ? 'url('+ image +')' : '').appendTo($station);
      $('<i/>', {'class': 'icon icon-hide', 'title': 'Скрыть'}).appendTo($station);
      $('<i/>', {'class': 'icon icon-show', 'title': 'Показать'}).appendTo($station);
      $('<h3/>', {'class': 'title', 'text': title}).appendTo($station);

      return $station;
    },

    renderStations: function() {
      var $container = $('#stations').empty();
      var stations = this.Storage.getStations();

      $.each(stations, function(name, station) {
        var rendered = this._renderStation(name, station.title, station.image);
        $container.append(rendered);
      }.bind(this));
    },

    initEvents: function() {
      var $page = this;

      $('ul.menu').on('click', 'li', function(e) {
        e.preventDefault();
        $('body').attr('data-page', $(this).data('page'));
      });

      // TODO: Удаление станции
      $('#stations')
        .on('click', '.station > .icon-hide', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          // TODO: Сохранять состояние станции
          $station.addClass('hidden');
        })
        .on('click', '.station > .icon-show', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          // TODO: Сохранять состояние станции
          $station.removeClass('hidden');
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