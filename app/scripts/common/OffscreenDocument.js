let creating;

export async function setupOffscreenDocument(path = '/offscreen.html') {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK, chrome.offscreen.Reason.LOCAL_STORAGE],
            justification: 'Background audio playback',
        });
        await creating;
        creating = null;
    }
}

async function closeOffscreenDocument() {
    await chrome.offscreen.closeDocument();
}
