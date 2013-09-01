(function(window, $) {
  var translateStatic = function() {
    $('[data-i18n]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n');
      $this.text(chrome.i18n.getMessage(i18nName));
    });
    $('[data-i18n-title]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n-title');
      $this.attr('title', chrome.i18n.getMessage(i18nName));
    });
    $('[data-i18n-placeholder]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n-placeholder');
      $this.attr('placeholder', chrome.i18n.getMessage(i18nName));
    });
    $('[data-i18n-value]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n-value');
      $this.attr('value', chrome.i18n.getMessage(i18nName));
    });
  };

  $(function() {
    translateStatic();
  });
})(window, jQuery);