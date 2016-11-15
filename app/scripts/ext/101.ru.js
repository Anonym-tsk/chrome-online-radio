/**
 * 101.ru external script
 */
(function() {
  'use strict';

  var playerWrapper = document.querySelector('#top-channel-block'),
      btnContainer = playerWrapper.querySelector('.ch-name'),
      playButton = playerWrapper.querySelector('.player-control'),
      link = document.querySelector('.ch-about h4 a'),
      title = btnContainer.querySelector('h1'),
      image = btnContainer.querySelector('.logo');
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
    var script = document.querySelector('#footer-line script:last-of-type'),
        scriptContent = script && script.innerText,
        playlist = scriptContent && scriptContent.match(/[\'\"]pl[\"\']\s?\:\s?[\'\"]([^\'^\"]+)[\"\']/);
    return playlist && playlist[1] && decodeURIComponent(playlist[1].split('|').join('&'));
  }

  function injectStyles() {
    var css = '.online-radio-add-button {' +
        'background: #fff;' +
        'display: inline-block;' +
        'margin: 0 0 0 10px;' +
        'width: 42px;' +
        'height: 42px;' +
        'cursor: pointer;' +
        '-webkit-mask: url("' + chrome.extension.getURL('images/38.png') + '") no-repeat center bottom;' +
        '-webkit-mask-size: 30px 30px;' +
      '}' +
      '.online-radio-add-button:hover {' +
        'background: #ef8800;' +
      '}' +
      '#top-channel-block .ch-name h1 {' +
        'width: auto;' +
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
  btnContainer.insertBefore(button, title.nextSibling);
})();
