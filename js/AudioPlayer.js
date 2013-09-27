(function(window) {
  /**
   * Audio player.
   * @constructor
   */
  var AudioPlayer = function(volume) {
    var _HtmlPlayer = new HtmlPlayer(volume);
    if (_HtmlPlayer.canPlayType()) {
      return _HtmlPlayer;
    }
    console.warn('Flash fallback');
    return new FlashPlayer(volume);
  };

  window.AudioPlayer = AudioPlayer;
})(window);