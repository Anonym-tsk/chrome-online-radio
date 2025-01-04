import AudioPlayer from './AudioPlayer.js';
import {sendMessageToBackground, sendMessageToPopup} from "../common/Utils.js";

/**
 * Retry on error counter.
 * @type {number}
 * @private
 */
let _attempts = 0;

/**
 * Statuses.
 * @const
 * @type {{BUFFERING: string, PLAYING: string, STOPPED: string, ERROR: string}}
 */
const STATUS = {
    BUFFERING: 'buffering',
    PLAYING: 'playing',
    STOPPED: 'stopped',
    ERROR: 'error'
};

/**
 * Current status.
 * @type {string}
 * @private
 */
let _status = STATUS.STOPPED;

/**
 * Init player events.
 */
function initPlayerEvents() {
    player.attachEvent('play', () => {
        setStatus(STATUS.BUFFERING);
    });
    player.attachEvent('playing', () => {
        _attempts = 0;
        setStatus(STATUS.PLAYING);
    });
    player.attachEvent('abort', () => {
        setStatus(STATUS.STOPPED);
    });
    player.attachEvent('error', async (e) => {
        if (_status === STATUS.STOPPED) {
            return;
        }

        if (_attempts++ < 10) {
            const stream = await sendMessageToBackground('getNextStream');
            player.play(stream);
        } else {
            _attempts = 0;
            setStatus(STATUS.ERROR);
        }
    });
}

/**
 * Set radio playing status.
 * @param {string=} st
 */
function setStatus(st) {
    _status = st || STATUS.STOPPED;
    sendMessageToPopup(_status);
    sendMessageToBackground(_status);
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.target !== 'offscreen') {
        return;
    }
    console.log('Message to offscreen', message);

    const action = message.action;
    const data = message.data;
    const volStep = 5;

    let volume;
    let stations;
    let station;
    let name;

    switch (action) {
        case 'getAudioData':
            sendResponse(player.getAudioData());
            break;

        case 'getStatus':
            sendResponse(_status);
            break;

        case 'play':
            name = await sendMessageToBackground('getLastName')
            if (data === name && player.isPlaying()) {
                player.stop();
            } else {
                station = await sendMessageToBackground('setLast', data);
                player.play(station.stream);
            }
            break;

        case 'playpause':
            if (player.isPlaying()) {
                player.stop();
            } else {
                station = await sendMessageToBackground('getLastStation');
                player.play(station.stream);
            }
            break;

        case 'prev':
        case 'next':
            stations = await sendMessageToBackground('getStations');
            const keys = Object.keys(stations);
            const length = keys.length;
            const lastName = await sendMessageToBackground('getLastName');
            const i = keys.indexOf(lastName);
            name = (action === 'next') ? keys[(i + 1) % length] : keys[(length + i - 1) % length];
            station = await sendMessageToBackground('setLast', name);
            player.play(station.stream);
            break;

        case 'volume':
            await sendMessageToBackground('setVolume', data);
            player.setVolume(data);
            break;

        case 'volumeup':
            volume = player.getVolume();
            if (volume < 100) {
                player.setVolume(Math.min(volume + volStep, 100));
            }
            break;

        case 'volumedown':
            volume = player.getVolume();
            if (volume > 0) {
                player.setVolume(Math.max(volume - volStep, 0));
            }
            break;

        case 'stream':
            const stream = await sendMessageToBackground('getStream', data);
            player.play(stream);
            break;

        default:
            console.warn(`Unexpected message type received: '${message.type}'.`);
            return false;
    }
});

let player;
(async () => {
    player = new AudioPlayer(await sendMessageToBackground('getVolume'));
    initPlayerEvents();
    setStatus();
})();
