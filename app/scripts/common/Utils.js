import {setupOffscreenDocument} from "./OffscreenDocument.js";

/**
 * Open options page.
 * @param {string} page
 */
export function openOptions(page) {
    const optionsUrl = chrome.runtime.getURL('options.html');
    const fullUrl = (typeof page === 'string') ? optionsUrl + '#' + page : optionsUrl;
    chrome.tabs.query({url: optionsUrl}, function(tabs) {
        if (tabs.length) {
            chrome.tabs.update(tabs[0].id, {active: true, url: fullUrl});
            chrome.tabs.reload(tabs[0].id);
        } else {
            chrome.tabs.create({url: fullUrl});
        }
    });
}

/**
 * Check updates and run callbacks.
 * @param {{previousVersion: string, reason: string}} details
 */
export function checkUpdates(details) {
    const updates = {
        '3.0.1': function() {},
    };

    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;

    if (previousVersion && currentVersion > previousVersion) {
        for (let version in updates) {
            if (updates.hasOwnProperty(version)) {
                if (version > previousVersion && version <= currentVersion) {
                    updates[version].call();
                    console.info('Update ' + version + ' installed');
                }
            }
        }

        openOptions('changelog');
    }
}

/**
 * Send message to background.
 * @param {string} action
 * @param {string=} data
 */
export async function sendMessageToBackground(action, data) {
    return chrome.runtime.sendMessage({
        action,
        target: 'background',
        data: typeof data !== 'undefined' ? data : null,
    });
}

/**
 * Send message to offscreen.
 * @param {string} action
 * @param {string=} data
 */
export async function sendMessageToOffscreen(action, data) {
    await setupOffscreenDocument();
    return chrome.runtime.sendMessage({
        action,
        target: 'offscreen',
        data: typeof data !== 'undefined' ? data : null,
    });
}

/**
 * Send message to popup.
 * @param {string} action
 * @param {string=} data
 */
export async function sendMessageToPopup(action, data) {
    return chrome.runtime.sendMessage({
        action,
        target: 'popup',
        data: typeof data !== 'undefined' ? data : null,
    });
}
