/**
 * tunein.com external script
 */
(function() {
  'use strict';

  function stop() {
    var playButtonContainer = document.querySelector('#tuner'),
        playButton = playButtonContainer && playButtonContainer.querySelector('.playbutton-cont');

    if (playButton && playButtonContainer.classList.contains('playing')) {
      var evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, true);
      playButton.dispatchEvent(evt);
    }
  }

  function injectStyles() {
    var css = '#online-radio-add-button {' +
        'cursor:pointer;' +
        'width:19px;' +
        'min-width:19px;' +
        'height:19px;' +
        'min-height:19px;' +
        'padding:5px 7px;' +
        'margin:0 0 0 7px;' +
        'border:1px solid #fff;' +
        'border-radius:3px;' +
      '}' +
      '#online-radio-add-button:after {' +
        'content:"";' +
        'display:block;' +
        'width:19px;' +
        'height:19px;' +
        'background:#fff;' +
        '-webkit-mask:url("' + chrome.extension.getURL('images/38.png') + '") no-repeat center;' +
        '-webkit-mask-size:19px 19px;' +
      '}' +
      '#online-radio-add-button:hover:after {' +
        'background:#36b4a7;' +
      '}' +
      '#online-radio-add-button:active {' +
        'background-color:#ddd;' +
        'border:1px solid #ddd;' +
      '}' +
      '#online-radio-add-button:active:after {' +
        'background:#000;' +
      '}';
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
  }

  function loadPlaylist(url, successCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var result = [],
            json = JSON.parse(xhr.responseText.slice(1, xhr.responseText.length - 2));
        json.Streams.filter(function(station) {
          return station.MediaType.toLowerCase() === 'mp3';
        }).sort(function(station1, station2) {
          return station1.Bandwidth < station2.Bandwidth;
        }).forEach(function(station) {
          result.push(station.Url);
          if (station.Url[station.Url.length - 1] === '/') {
            result.push(station.Url + ';'); // Shoutcast fix
          }
        });
        successCallback(result.slice(0, 6));
      }
    };
    xhr.open('GET', url, true);
    xhr.send(null);
  }

  function loadMetadata(url, successCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var data = xhr.responseText.match(/TuneIn.payload\s?=\s?(.+)/);
        successCallback(data && data[1] ? JSON.parse(data[1]) : null);
      }
    };
    xhr.open('GET', url, true);
    xhr.send(null);
  }

  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'background', action: action, data: typeof data !== 'undefined' ? data : null});
  }

  function init() {
    var button = document.querySelector('#online-radio-add-button');
    if (button) {
      return true;
    }

    var btnContainer = document.querySelector('#fixable-header .hero-buttons');
    if (!btnContainer) {
      return false;
    }

    loadMetadata(currentLocation, function(metadata) {
      if (!metadata || !metadata.Station || !metadata.Station.broadcast) {
        return;
      }

      button = document.createElement('li');
      button.id = 'online-radio-add-button';
      button.className = 'fl-l';
      button.title = chrome.i18n.getMessage('add');
      button.onclick = function() {
        loadMetadata(currentLocation, function(metadata) {
          if (!metadata) {
            return;
          }

          loadPlaylist(metadata.Station.broadcast.StreamUrl, function(streams) {
            stop();

            var link = metadata.Station.broadcast.ShareData.url || null,
                title = metadata.Station.broadcast.ShareData.title,
                image = metadata.Station.broadcast.ShareLogo;

            sendMessage('add', {
              title: title ? 'tunein.com ● ' + title : 'tunein.com',
              streams: streams,
              image: image,
              url: link,
              name: link.replace(/\W/g, '')
            });
          });
        });
      };

      btnContainer.appendChild(button);
    });

    return true;
  }

  var currentLocation, inited = false;
  (function checkLocation() {
    if (window.location.href !== currentLocation) {
      currentLocation = window.location.href;
      inited = false;
    } else if (!inited) {
      inited = init();
    }
    setTimeout(checkLocation, 100);
  })();

  injectStyles();
})();
