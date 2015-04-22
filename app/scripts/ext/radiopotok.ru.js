/**
 * radiopotok.ru external script
 */
(function() {
  'use strict';

  function injectStyles() {
    var css = '.online-radio-add-button {' +
        'cursor:pointer;' +
        'width:40px;' +
        'height:34px;' +
        'padding:0px 10px !important;' +
      '}' +
      '.online-radio-add-button:after {' +
        'content:"";' +
        'display:block;' +
        'width:16px;' +
        'height:16px;' +
        'background:#000;' +
        '-webkit-mask:url("' + chrome.extension.getURL('images/38.png') + '") no-repeat center;' +
        '-webkit-mask-size:16px 16px;' +
      '}' +
      '.item-multi-small .online-radio-add-button, .item-small .online-radio-add-button {' +
        'width:23px;' +
        'height:22px;' +
        'padding:1px 4px 0 4px !important;' +
      '}' +
      '.item-multi-small .online-radio-add-button:after, .item-small .online-radio-add-button:after {' +
        'width:13px;' +
        'height:13px;' +
        '-webkit-mask-size:13px 13px;' +
      '}';
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
  }

  function sendMessage(action, data) {
    chrome.runtime.sendMessage({name: 'background', action: action, data: typeof data !== 'undefined' ? data : null});
  }

  function stop() {
    var playButton = document.querySelector('#playerPlayButton');
    if (playButton && playButton.classList.contains('player-stop')) {
      var evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, true);
      playButton.dispatchEvent(evt);
    }
  }

  function buttonClickHandler(playButton) {
    stop();

    var head = document.getElementsByTagName('head')[0],
        header = playButton.parentNode.parentNode,
        streams = [],

        linkTag = header.querySelector('a[rel=canonical]'),
        metaLink = head.querySelector('meta[property="og:url"]'),
        link = linkTag && linkTag.href || metaLink && metaLink.content,

        metaTitle = head.querySelector('meta[property="og:description"]'),
        title = playButton.dataset.title || linkTag && linkTag.textContent || metaTitle && metaTitle.content,

        imageTag = header.parentNode.parentNode.querySelector('.img-thumbnail'),
        metaImage = head.querySelector('meta[property="og:image"]'),
        image = imageTag && imageTag.src.replace('/s_', '/') || metaImage && metaImage.content.replace('/s_', '/');

    [playButton.dataset.stream1, playButton.dataset.stream2, playButton.dataset.stream3].forEach(function(stream) {
      if (stream) {
        streams.push(stream);
      }
    });

    sendMessage('add', {
      title: 'radiopotok.ru ● ' + title,
      streams: streams,
      image: image,
      url: link,
      name: link.replace(/\W/g, '')
    });
  }

  var playButtons = document.querySelectorAll('.btn.play-radio');
  if (!playButtons.length) {
    return;
  }

  injectStyles();

  for (var i = 0, l = playButtons.length; i < l; i++) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'online-radio-add-button btn btn-default';
    button.title = chrome.i18n.getMessage('add');
    button.onclick = buttonClickHandler.bind(button, playButtons[i]);
    playButtons[i].parentNode.insertBefore(button, playButtons[i]);
  }
})();
