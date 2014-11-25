define(['jquery'], function($) {
  'use strict';

  function translateMessage(key) {
    return chrome.i18n.getMessage(key);
  }

  function translateAll($parent) {
    $parent = $parent || $(document);
    $parent.find('[data-i18n]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n');
      $this.text(translateMessage(i18nName));
    });
    $parent.find('[data-i18n-title]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n-title');
      $this.attr('title', translateMessage(i18nName));
    });
    $parent.find('[data-i18n-placeholder]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n-placeholder');
      $this.attr('placeholder', translateMessage(i18nName));
    });
    $parent.find('[data-i18n-value]').each(function() {
      var $this = $(this);
      var i18nName = $this.data('i18n-value');
      $this.attr('value', translateMessage(i18nName));
    });
  }

  /**
   * @typedef {{}} Translator
   */
  return {
    translate: translateMessage,
    translateAll: translateAll
  };
});
