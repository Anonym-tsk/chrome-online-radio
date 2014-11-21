/**
 * 101.ru external script
 */
(function() {
  'use strict';

  var btnContainer = document.getElementById('pl_vote_y');
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
    var playerId = playButton && playButton.getAttribute('playerid'),
      playerObject = playerId && document.getElementById(playerId),
      flashVarsParam = playerObject && playerObject.querySelector('param[name="flashvars"]'),
      flashvars = flashVarsParam && decodeURIComponent(flashVarsParam.getAttribute('value')),
      playlist = flashvars && /pl\=([^&]+)\&/.exec(flashvars);
    return playlist && playlist[1] && playlist[1].split('|').join('&');
  }

  function injectStyles() {
    var css = '.online-radio-add-button {' +
        'display:block;' +
        'cursor:pointer;' +
        'width:19px;' +
        'height:19px;' +
        'margin:5px 0 0 0;' +
        'float:left;' +
        'background:url("' + chrome.extension.getURL('images/19.101.ru.png') + '") no-repeat center;' +
        'background-size:19px 19px;' +
        '-webkit-filter: brightness(10) grayscale(1);' +
      '}' +
      '.online-radio-add-button:hover {' +
        '-webkit-filter: brightness(1) grayscale(0);' +
      '}' +
      '@media only screen and (-Webkit-min-device-pixel-ratio: 1.5), only screen and (-o-min-device-pixel-ratio: 3/2) {' +
        '.online-radio-add-button {' +
          'background-image:url("' + chrome.extension.getURL('images/38.101.ru.png') + '");' +
        '}' +
      '}';
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
  }

  function loadPlaylist(successCallback) {
    var playlistUrl = getPlaylistUrl();
    if (!playlistUrl) {
      return [];
    }
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        var result = json.playlist.map(function(station) {
          var a = document.createElement('a');
          a.href = station.file;
          return a.origin + a.pathname;
        });
        successCallback(result);
      }
    };
    xhr.open('GET', playlistUrl, true);
    xhr.send(null);
  }

  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'background', action: action, data: typeof data !== 'undefined' ? data : null});
  }

  var button = document.createElement('span');
  button.className = 'online-radio-add-button';
  button.title = chrome.i18n.getMessage('add');
  button.onclick = function() {
    loadPlaylist(function(streams) {
      stop();

      var link = document.querySelector('#channel_infoblock a:not([target])'),
          title = document.querySelector('#player-site .channel-base h1'),
          image = document.querySelector('#chan_cover img');

      sendMessage('add', [
        title ? '101.ru ● ' + title.innerText : '101.ru',
        streams,
        link && link.href,
        image && image.src,
        link && link.innerText
      ]);
    });
  };
  injectStyles();
  btnContainer.appendChild(button);
})();
