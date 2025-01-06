export function translate(key) {
    return chrome.i18n.getMessage(key);
}

export function translateAll($parent) {
    $parent = $parent || document;
    $parent.querySelectorAll('[data-i18n]').forEach(($this) => {
        const i18nName = $this.dataset.i18n;
        $this.innerHTML = translate(i18nName);
    });
    $parent.querySelectorAll('[data-i18n-title]').forEach(($this) => {
        const i18nName = $this.dataset.i18nTitle;
        $this.setAttribute('title', translate(i18nName));
    });
    $parent.querySelectorAll('[data-i18n-placeholder]').forEach(($this) => {
        const i18nName = $this.dataset.i18nPlaceholder;
        $this.setAttribute('placeholder', translate(i18nName));
    });
    $parent.querySelectorAll('[data-i18n-value]').forEach(($this) => {
        const i18nName = $this.dataset.i18nValue;
        $this.setAttribute('value', translate(i18nName));
    });
}
