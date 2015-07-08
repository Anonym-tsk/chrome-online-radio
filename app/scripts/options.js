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
   * Save options data to file.
   * @param {string} options
   * @private
   */
  function _saveOptionsFile(options) {
    var a = document.createElement('a');
    var file = new Blob([options], {encoding: 'UTF-8', type: 'application/json;charset=UTF-8'});
    a.href = URL.createObjectURL(file);
    a.download = 'OnlineRadio.json';
    a.click();
  }

  function _getFileContent(callback) {
    var fileChooser = document.createElement('input');
    fileChooser.type = 'file';
    fileChooser.multiple = false;
    fileChooser.accept = '.json,application/json';

    fileChooser.addEventListener('change', function() {
      var file = fileChooser.files[0],
          reader = new FileReader();

      reader.onload = function(evt) {
        callback(evt.target.result);
      };

      reader.onerror = function() {
        callback(null);
      };

      reader.readAsText(file);
    });

    fileChooser.click();
  }

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

    switch (hash[0]) {
      case 'add':
        openAddStationTab.apply(null, hash);
        break;
      case 'flash':
        openFlashTab();
        break;
      default:
        openStationsTab();
    }
  }

  /**
   * Get form template from head.
   * @return {jQuery}
   */
  function getFormTemplate() {
    var template = $('#addStation').html(),
        $template = $(template);
    Translator.translateAll($template);
    return $template;
  }

  /**
   * Open add station page.
   * @param {Event|string=} event
   * @param {string=} title
   * @param {string=} stream
   * @param {string=} url
   */
  function openAddStationTab(event, title, stream, url) {
    var $template = getFormTemplate(),
        $page = $('section[data-page="add"]');

    if (typeof event === 'string') {
      $template.find('[name="title"]').val(title || '');
      $template.find('[name="streams"]').val(stream || '');
      $template.find('[name="url"]').val(url || '');
    }

    $('body').attr('data-page', 'add');
    $page.find('.addStation').remove();
    $page.append($template);
  }

  /**
   * Open stations list page.
   */
  function openStationsTab() {
    $('body').attr('data-page', 'stations');
    $('section[data-page="stations"]').find('.edit').removeClass('edit').find('.addStation').remove();
  }

  /**
   * Open flash error page.
   */
  function openFlashTab() {
    $('body').attr('data-page', 'flash');
  }

  /**
   * Open hotkeys options.
   */
  function openHotkeysTab() {
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
  }

  /**
   * Open export page.
   */
  function openExportTab() {
    $('body').attr('data-page', 'export');
    $('#export').find('.export > textarea').val(_storage.exportData());
  }

  /**
   * Open import page.
   */
  function openImportTab() {
    $('body').attr('data-page', 'import');
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
      .on('click', 'li[data-page="add"]', openAddStationTab)
      .on('click', 'li[data-page="stations"]', openStationsTab)
      .on('click', 'li[data-page="flash"]', openFlashTab)
      .on('click', 'li[data-page="hotkeys"]', openHotkeysTab)
      .on('click', 'li[data-page="export"]', openExportTab)
      .on('click', 'li[data-page="import"]', openImportTab);

    $('#stations')
      .on('click', '.station > .icon-edit', function(e) {
        e.preventDefault();
        var $station = $(this).parent('.station');
        if ($station.hasClass('edit')) {
          $station.removeClass('edit').find('.addStation').remove();
          return;
        }

        var name = $station.data('name'),
          station = _storage.getStationByName(name);

        var $template = getFormTemplate().data('name', name);
        $template.find('[name="title"]').val(station.title);
        $template.find('[name="url"]').val(station.url || '');
        $template.find('[name="image"]').val(station.image || '');
        var $input = $template.find('[name="streams"]').val(station.streams[0]);
        for (var i = 1, l = station.streams.length; i < l; i++) {
          $input = $input.clone().val(station.streams[i]).insertAfter($input);
        }
        $template.find('[type="submit"]').val(Translator.translate('save'));
        $station.addClass('edit').append($template);
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

    $(document)
      .on('click', '.field-streams > .icon-add', function(e) {
        e.preventDefault();
        var $input = $(this).siblings('input:last');
        $input.clone().val('').insertAfter($input);
      })
      .on('click', '.field-streams > .icon-delete', function(e) {
        e.preventDefault();
        $(this).siblings('input:last').remove();
      })
      .on('submit', '.addStation', function(e) {
        e.preventDefault();
        var $this = $(this),
            station = {name: $this.data('name')};

        $this.serializeArray().forEach(function(item) {
          if (item.name === 'streams') {
            station[item.name] = station[item.name] || [];
            station[item.name].push(item.value);
          } else {
            station[item.name] = item.value;
          }
        });

        _storage.addStation(station);
        renderStations();
        openStationsTab();
      });

    $('#export').on('click', '.savefile', function(e) {
      e.preventDefault();
      _saveOptionsFile(_storage.exportData());
    });

    $('#import')
      .on('click', '.loadfile', function(e) {
        e.preventDefault();
        _getFileContent(function(data) {
          var $container = $('#import'),
              $error = $container.find('.error'),
              $success = $container.find('.success'),
              $textarea = $container.find('textarea');
          if (data) {
            $textarea.val(data).trigger('paste');
            $error.hide();
          } else {
            $success.hide();
            $error.show();
          }
        });
      })
      .on('click', '.importdata', function(e) {
        e.preventDefault();
        var $container = $('#import'),
            $error = $container.find('.error'),
            $success = $container.find('.success'),
            $textarea = $container.find('textarea'),
            result = _storage.importData($textarea.val());
        $error.toggle(!result);
        $success.toggle(result);
      })
      .on('input propertychange paste', 'textarea', function() {
        $('#import').find('.importdata').attr('disabled', !this.value.length || !this.value.trim());
      });
  }

  openTab();
  renderStations();
  initEvents();
  Translator.translateAll();
});
