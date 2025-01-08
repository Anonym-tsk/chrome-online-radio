import Station from './Station.js';

/**
 * Favorites.
 * @type {[]}
 */
let _favorites = [];

/**
 * Hidden stations list.
 * @type {{}}
 */
let _hidden = {};

/**
 * Last station name.
 * @type {string}
 */
let _last = '';

/**
 * Volume.
 * @type {{current: number, last: number}}
 */
let _volume = {current: 80, last: 80};

/**
 * Core stations.
 * @type {{}}
 */
const _coreStations = {};

/**
 * User stations.
 * @type {[key: string], Station}
 */
const _userStations = {};

async function _save(name, value) {
    return chrome.storage.local.set({[name.toString()]: value});
}

async function _get(name, defaultValue) {
    return (await chrome.storage.local.get(name))?.[name] ?? defaultValue;
}

/**
 * Add a station to favorites.
 * @param {string} name Station name.
 * @public
 */
export async function like(name) {
    if (!isFavorite(name)) {
        _favorites.push(name);
    }
    await _save('_favorites', _favorites);
}

/**
 * Remove a station from favorites.
 * @param {string} name Station name.
 * @public
 */
export async function dislike(name) {
    const index = _favorites.indexOf(name);
    if (index >= 0) {
        _favorites.splice(index, 1);
    }
    await _save('_favorites', _favorites);
}

/**
 * Check station in favorites.
 * @param {string} name Station name.
 * @return {boolean}
 * @public
 */
export function isFavorite(name) {
    return _favorites.indexOf(name) >= 0;
}

/**
 * Get names of favorites.
 * @return {Object}
 * @public
 */
export function getFavorites() {
    return _favorites;
}

/**
 * Set all favorites.
 * @param {[]} favorites
 */
export async function setFavorites(favorites) {
    _favorites = favorites;
    await _save('_favorites', _favorites);
}

/**
 * Get all stations.
 * @return {{[key: string], Station}}
 * @public
 */
export function getStations() {
    const stations = {};
    let name;
    for (name in _coreStations) {
        if (_coreStations.hasOwnProperty(name)) {
            stations[name] = _coreStations[name].plain();
        }
    }
    for (name in _userStations) {
        if (_userStations.hasOwnProperty(name)) {
            stations[name] = _userStations[name].plain();
        }
    }
    return stations;
}

/**
 * Get station by name.
 * @param {string} name Station name.
 * @return {?Station}
 * @public
 */
export function getStationByName(name) {
    if (_coreStations.hasOwnProperty(name)) {
        return _coreStations[name];
    }
    if (_userStations.hasOwnProperty(name)) {
        return _userStations[name];
    }
    return null;
}

/**
 * Export data to string.
 * @return {string}
 */
export function exportData() {
    const res = Object.entries(_userStations).reduce((acc, [name, station]) => {
        acc[name] = {
            name: station.name,
            title: station.title,
            url: station.url,
            image: station.image,
            streams: station.streams,
        };
        return acc;
    }, {});
    return JSON.stringify({'stations': res});
}

/**
 * Import data from string.
 * @return {boolean}
 */
export function importData(data) {
    try {
        data = JSON.parse(data);
        if (!data.stations) {
            return false;
        }
        for (let i in data.stations) {
            if (data.stations.hasOwnProperty(i)) {
                addStation(data.stations[i]);
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Set the last played station.
 * @param {string} name Station name.
 * @public
 */
export async function setLast(name) {
    _last = name;
    await _save('_last', _last);
}

/**
 * Get the last played station name.
 * @return {string}
 * @public
 */
export function getLastName() {
    return _last;
}

/**
 * Get the last played station.
 * @return {Station}
 * @public
 */
export function getLastStation() {
    return getStationByName(_last);
}

/**
 * Get volume.
 * @return {number}
 * @public
 */
export function getVolume() {
    return Number(_volume.current) || 0;
}

/**
 * Get last before current volume value.
 * @return {number}
 * @public
 */
export function getVolumeLast() {
    return Number(_volume.last) || 80;
}

/**
 * Save volume value.
 * @param {number} volume Volume.
 * @public
 */
export async function setVolume(volume) {
    const last = _volume.current;
    _volume = {current: volume, last};
    await _save('_volume', _volume);
}

/**
 * Save users station.
 * @param {{name: string, title: string, url: string, streams: {}|[], image: string}} stationMap
 * @return {Station}
 * @public
 */
export async function addStation(stationMap) {
    if (!stationMap.name) { // Создаем новую станцию
        stationMap.name = (+new Date()).toString() + Object.keys(_userStations).length.toString();
    }
    _userStations[stationMap.name] = new Station(stationMap.name, stationMap.title, stationMap.url || '', stationMap.streams, stationMap.image || '', true);
    await _save('_stations', _userStations);
    return _userStations[stationMap.name];
}

/**
 * Delete users station.
 * @param {string} name Station name.
 * @public
 */
export async function deleteStation(name) {
    if (_userStations.hasOwnProperty(name)) {
        delete _userStations[name];
        await _save('_stations', _userStations);
    } else if (_coreStations.hasOwnProperty(name)) {
        _coreStations[name].setHidden(true);
        _hidden[name] = 1;
        await _save('_hidden', _hidden);
    }
}

/**
 * Restore deleted core station.
 * @param {string} name Station name.
 * @public
 */
export async function restoreStation(name) {
    if (_hidden.hasOwnProperty(name)) {
        _coreStations[name].setHidden(false);
        delete _hidden[name];
        await _save('_hidden', _hidden);
    }
}

/**
 * Load core stations by url.
 * @param {string} url
 * @private
 */
async function _loadCoreStations(url) {
    const request = await fetch(url);
    const json = await request.json();
    for (let name in json) {
        if (json.hasOwnProperty(name)) {
            _coreStations[name] = new Station(name, json[name].title, json[name].url, json[name].streams, json[name].image, false, _hidden.hasOwnProperty(name));
        }
    }
}

/**
 * Load user stations.
 * @private
 */
async function _loadUserStations() {
    const json = await _get('_stations', {});
    for (let name in json) {
        if (json.hasOwnProperty(name)) {
            _userStations[name] = new Station(name, json[name].title, json[name].url, json[name].streams, json[name].image, true);
        }
    }
}

export async function init() {
    if (Object.keys(_coreStations).length > 0) {
        return;
    }

    // Load core stations list
    try {
        await _loadCoreStations('https://radio.vasilchuk.net/stations.json');
    } catch (e) {
        await _loadCoreStations(chrome.runtime.getURL('stations.json'));
    }

    // Load users stations list
    await _loadUserStations();

    _favorites = await _get('_favorites', []);
    if (typeof _favorites !== 'object') {
        _favorites = [];
    }
    _last = await _get('_last', Object.keys(_coreStations)[0]);
    _hidden = await _get('_hidden', {});
    if (typeof _hidden !== 'object') {
        _hidden = {};
    }
    _volume = await _get('_volume', {current: 80, last: 80});
    if (typeof _volume !== 'object') {
        _volume = {};
    }
}
