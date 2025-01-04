import {setupOffscreenDocument} from './OffscreenDocument.js';
import {translate} from "../common/Translator.js";
import * as DataStorage from './DataStorage.js';
import {getStationByName} from "./DataStorage.js";
import {checkUpdates, openOptions} from "../common/Utils";

// Check updates.
chrome.runtime.onInstalled.addListener(function(details) {
    'use strict';
    checkUpdates(details);
});

async function getDataFromOffscreen(dataType, data) {
    return chrome.runtime.sendMessage({
        target: 'offscreen',
        action: dataType,
        data: typeof data !== 'undefined' ? data : null,
    });
}

// Hotkeys listener
chrome.commands.onCommand.addListener(async (command) => {
    await getDataFromOffscreen(command);
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.target !== 'background') {
        return;
    }
    console.log('Message to background', message);

    let station;
    switch (message.action) {
        case 'link':
            station = DataStorage.getStationByName(message.data);
            chrome.tabs.create({url: station.url});
            break;

        case 'options':
            openOptions(message.data);
            break;

        case 'like':
            DataStorage.like(message.data);
            break;

        case 'dislike':
            DataStorage.dislike(message.data);
            break;

        case 'exportData':
            sendResponse(DataStorage.exportData());
            break;

        case 'importData':
            sendResponse(DataStorage.importData(message.data));
            break;

        case 'getStationByName':
            station = DataStorage.getStationByName(message.data);
            sendResponse(station.plain());
            break;

        case 'getLastName':
            sendResponse(DataStorage.getLastName());
            break;

        case 'setLast':
            DataStorage.setLast(message.data);
            station = DataStorage.getStationByName(message.data);
            sendResponse(station.plain());
            break;

        case 'getStream':
            station = DataStorage.getLastStation();
            sendResponse(station.getStream(message.data));
            break;

        case 'getNextStream':
            station = DataStorage.getLastStation();
            sendResponse(station.getNextStream());
            break;

        case 'setVolume':
            DataStorage.setVolume(message.data);
            break;

        case 'deleteStation':
            DataStorage.deleteStation(message.data);
            break;

        case 'restoreStation':
            DataStorage.restoreStation(message.data);
            break;

        case 'addStation':
            DataStorage.addStation(message.data);
            break;

        case 'isFavorite':
            sendResponse(DataStorage.isFavorite(message.data));
            break;

        case 'getStations':
            sendResponse(DataStorage.getStations());
            break;

        case 'getFavorites':
            sendResponse(DataStorage.getFavorites());
            break;

        case 'getVolumeLast':
            sendResponse(DataStorage.getVolumeLast());
            break;

        case 'getVolume':
            sendResponse(DataStorage.getVolume());
            break;

        case 'getLastStation':
            station = DataStorage.getLastStation();
            sendResponse(station.plain());
            break;

        case 'buffering':
            station = DataStorage.getLastStation();
            chrome.action.setIcon({path: {'19': '../../images/19o.png', '38': '../../images/38o.png'}});
            chrome.action.setTitle({title: station?.title + ' - ' + translate('loading')});
            break;
        case 'playing':
            station = DataStorage.getLastStation();
            chrome.action.setIcon({path: {'19': '../../images/19g.png', '38': '../../images/38g.png'}});
            chrome.action.setTitle({title: station?.title});
            break;
        case 'stopped':
            station = DataStorage.getLastStation();
            chrome.action.setIcon({path: {'19': '../../images/19.png', '38': '../../images/38.png'}});
            chrome.action.setTitle({title: station?.title + ' - ' + translate('stopped')});
            break;
        case 'error':
            station = DataStorage.getLastStation();
            chrome.action.setIcon({path: {'19': '../../images/19r.png', '38': '../../images/38r.png'}});
            chrome.action.setTitle({title: station?.title + ' - ' + translate('error')});
            break;
        default:
            chrome.action.setIcon({path: {'19': '../../images/19.png', '38': '../../images/38.png'}});
            chrome.action.setTitle({title: translate('name')});
    }
});

async function initBackground() {
    await setupOffscreenDocument();
}

initBackground().catch((e) => {
    console.error('Background error', e);
});
