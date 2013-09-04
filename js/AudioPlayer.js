(function(window) {
  /**
   * Audio player.
   * @constructor
   */
  var AudioPlayer = function() {
    var _HtmlPlayer = new HtmlPlayer();
    if (_HtmlPlayer.canPlayType()) {
      return _HtmlPlayer;
    }
    console.warn('Flash fallback');
    return new FlashPlayer();
  };

  window.AudioPlayer = AudioPlayer;
})(window);