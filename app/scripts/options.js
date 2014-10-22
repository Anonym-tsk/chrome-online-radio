require.config({
  baseUrl: 'scripts',
  paths: {
    jquery: 'lib/jquery.min'
  }
});

require(['jquery', 'utils/Translator'], function($, Translator) {
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
  var _storage = _background.getStorage();

  /**
   * Renders one station for stations list.
   * @param {string} name
   * @param {Station} station
   * @return {jQuery}
   */
  function renderStation(name, station) {
    var $station = $('<div/>', {'class': 'station' + (station.isHidden() ? ' hidden' : ''), 'data-name': name, 'data-type': station.type});
    $('<div/>', {'class': 'image'}).css('backgroundImage', station.image ? 'url(' + station.image + ')' : '').appendTo($station);
    $('<i/>', {'class': 'icon icon-delete', 'title': Translator.translate('delete')}).appendTo($station);
    $('<i/>', {'class': 'icon icon-restore', 'title': Translator.translate('restore')}).appendTo($station);
    if (station.isUserStation()) {
      $('<i/>', {'class': 'icon icon-edit', 'title': Translator.translate('edit')}).appendTo($station);
    }
    $('<h3/>', {'class': 'title', 'text': station.title}).appendTo($station);

    return $station;
  }

  /**
   * Open tab from hash.
   */
  function openTab() {
    if (!window.location.hash) {
      return;
    }

    var hash = window.location.hash.substring(1);
    hash = hash.split('#');

    if (hash[0]) {
      $('body').attr('data-page', hash[0]);
    }

    if (hash[1] && hash[2]) {
      var $station = $('#addStation');
      $station.find('[name="title"]').val(hash[1]);
      $station.find('[name="stream"]').val(hash[2]);
      if (hash[3]) {
        $station.find('[name="url"]').val(hash[3]);
      }
    }
  }

  /**
   * Renders stations list.
   */
  function renderStations() {
    var $container = $('#stations').empty();
    var stations = _storage.getStations();

    $.each(stations, function(name, station) {
      var rendered = renderStation(name, station);
      $container.append(rendered);
    });
  }

  /**
   * Init events.
   */
  function initEvents() {
    $('ul.menu')
      .on('click', 'li[data-page]', function(e) {
        e.preventDefault();
        $('body').attr('data-page', $(this).data('page'));
      })
      .on('click', 'li[data-extpage]', function(e) {
        e.preventDefault();
        chrome.tabs.create({url: $(this).data('extpage')});
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
          station = _storage.getStationByName(name);

        var $form = $('#addStation').clone().removeAttr('id').data('name', name);
        $form.find('[name="title"]').val(station.title);
        $form.find('[name="url"]').val(station.url || '');
        $form.find('[name="image"]').val(station.image);
        $form.find('[name="stream"]').val(station.getStream());
        $form.find('[type="submit"]').val(Translator.translate('save'));
        $station.addClass('edit').append($form);
      })
      .on('click', '.station > .icon-delete', function(e) {
        e.preventDefault();
        var $station = $(this).parent('.station'),
          name = $station.data('name');
        if (window.confirm(Translator.translate('reallyDelete'))) {
          _storage.deleteStation(name);
          renderStations();
        }
      })
      .on('click', '.station > .icon-restore', function(e) {
        e.preventDefault();
        var $station = $(this).parent('.station'),
          name = $station.data('name');
        _storage.restoreStation(name);
        renderStations();
      });

    $(document).on('submit', '.addStation', function(e) {
      e.preventDefault();
      var $this = $(this);
      _storage.addStation(
        $this.find('[name="title"]').val(),
        [$this.find('[name="stream"]').val()],
        $this.find('[name="url"]').val(),
        $this.find('[name="image"]').val(),
        $this.data('name')
      );
      renderStations();
      $('body').attr('data-page', 'stations');
      $this.get(0).reset();
    });
  }

  openTab();
  renderStations();
  initEvents();
  Translator.translateAll();
});
