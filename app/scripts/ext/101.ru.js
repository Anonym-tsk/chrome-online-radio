/**
 * 101.ru external script
 */
(function() {
  'use strict';

  var btnContainer = document.querySelector('.channel-base');
  var playButton = document.querySelector('.general_play');
  if (!btnContainer) {
    return;
  }

  function stop() {
    if (playButton && playButton.classList.contains('stop')) {
      var evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, true);
      playButton.dispatchEvent(evt);
    }
  }

  function getPlaylistUrl() {
    var script = document.querySelector('#player-site .channel-base script'),
        scriptContent = script && script.innerText,
        playlist = scriptContent && scriptContent.match(/[\'\"]pl[\"\']\s?\:\s?[\'\"]([^\'^\"]+)[\"\']/);
    return playlist && playlist[1] && decodeURIComponent(playlist[1].split('|').join('&'));
  }

  function injectStyles() {
    var css = '.online-radio-add-button {' +
        'display:block;' +
        'cursor:pointer;' +
        'width:19px;' +
        'height:19px;' +
        'margin:5px 0 0 0;' +
        'float:left;' +
        'background:#fff;' +
        '-webkit-mask:url("' + chrome.extension.getURL('images/38.png') + '") no-repeat center;' +
        '-webkit-mask-size:19px 19px;' +
      '}' +
      '.online-radio-add-button:hover {' +
        'background:#ef8800;' +
      '}';
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
  }

  function loadPlaylist(playlistUrl, successCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        var result = json.playlist.map(function(station) {
          var a = document.createElement('a');
          a.href = station.file;
          return a.origin + a.pathname;
        });
        successCallback(result.slice(0, 5));
      }
    };
    xhr.open('GET', playlistUrl, true);
    xhr.send(null);
  }

  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'background', action: action, data: typeof data !== 'undefined' ? data : null});
  }

  var playlistUrl = getPlaylistUrl();
  if (!playlistUrl) {
    return;
  }

  var button = document.createElement('span');
  button.className = 'online-radio-add-button';
  button.title = chrome.i18n.getMessage('add');
  button.onclick = function() {
    loadPlaylist(playlistUrl, function(streams) {
      stop();

      var link = document.querySelector('#channel_infoblock a:not([target])'),
          title = document.querySelector('#player-site .channel-base h1'),
          image = document.querySelector('#chan_cover img');

      sendMessage('add', {
        title: title ? '101.ru ● ' + title.innerText : '101.ru',
        streams: streams,
        image: image && image.src,
        url: link && link.href,
        name: link && link.innerText
      });
    });
  };
  injectStyles();
  btnContainer.insertBefore(button, btnContainer.querySelector('#airfavmsg'));
})();
