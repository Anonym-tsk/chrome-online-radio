(function(window) {
  'use strict';

  /**
   * Audio player.
   * @param {number} volume
   * @constructor
   */
  function AudioPlayer(volume) {
    var _HtmlPlayer = new HtmlPlayer(volume);
    if (_HtmlPlayer.canPlayType()) {
      return _HtmlPlayer;
    }
    console.warn('Flash fallback');
    return new FlashPlayer(volume);
  }

  window.AudioPlayer = AudioPlayer;
})(window);
