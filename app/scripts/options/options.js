import {translate, translateAll} from '../common/Translator.js';
import {sendMessageToBackground} from "../common/Utils.js";

/**
 * Save options data to file.
 * @param {string} options
 * @private
 */
function _saveOptionsFile(options) {
    var a = document.createElement('a');
    var file = new Blob([options], {encoding: 'UTF-8', type: 'application/json;charset=UTF-8'});
    a.href = URL.createObjectURL(file);
    a.download = 'OnlineRadio.json';
    a.click();
}

function _getFileContent(callback) {
    const fileChooser = document.createElement('input');
    fileChooser.type = 'file';
    fileChooser.multiple = false;
    fileChooser.accept = '.json,application/json';

    fileChooser.addEventListener('change', function() {
        const file = fileChooser.files[0];
        const reader = new FileReader();

        reader.onload = function(evt) {
            callback(evt.target.result);
        };

        reader.onerror = function() {
            callback(null);
        };

        reader.readAsText(file);
    });

    fileChooser.click();
}

function renderStation(name, station) {
    const $station = document.createElement('div');
    $station.className = 'station' + (station.isHidden ? ' hidden' : '');
    $station.dataset.name = name;

    const $image = document.createElement('div');
    $image.className = 'image';
    $image.style.backgroundImage = station.image ? 'url(' + station.image + ')' : '';
    $station.appendChild($image);

    const $delete = document.createElement('i');
    $delete.className = 'icon icon-delete';
    $delete.title = translate('delete');
    $delete.addEventListener('click', async (e) => {
        e.preventDefault();
        const $station = $delete.parentNode;
        const name = $station.dataset.name;
        if (window.confirm(translate('reallyDelete'))) {
            await sendMessageToBackground('deleteStation', name);
            await renderStations();
        }
    });
    $station.appendChild($delete);

    const $restore = document.createElement('i');
    $restore.className = 'icon icon-restore';
    $restore.title = translate('restore');
    $restore.addEventListener('click', async (e) => {
        e.preventDefault();
        const $station = $restore.parentNode;
        const name = $station.dataset.name;
        await sendMessageToBackground('restoreStation', name);
        await renderStations();
    });
    $station.appendChild($restore);

    if (station.isUser) {
        const $edit = document.createElement('i');
        $edit.className = 'icon icon-edit';
        $edit.title = translate('edit');
        $edit.addEventListener('click', async (e) => {
            e.preventDefault();
            if ($station.classList.contains('edit')) {
                $station.classList.remove('edit');
                $station.removeChild($station.querySelector('.addStation'));
                return;
            }

            const name = $station.dataset.name,
            station = await sendMessageToBackground('getStationByName', name);

            const $template = getFormTemplate();
            $template.querySelector('[name="title"]').value = station.title;
            $template.querySelector('[name="url"]').value = station.url || '';
            $template.querySelector('[name="image"]').value = station.image || '';

            const names = Object.keys(station.streams);
            const $input = $template.querySelector('[name="streams"]');
            $input.value = station.streams[names[0]];
            for (let i = 1, l = names.length; i < l; i++) {
                const $newInput = $input.cloneNode(true);
                $newInput.value = station.streams[names[i]];
                $input.after($newInput);
            }
            $template.querySelector('[type="submit"]').value = translate('save');
            $station.classList.add('edit');
            $station.appendChild($template);

            const $form = $station.querySelector('.addStation');
            $form.dataset.name = name;
            $form.querySelector('.icon-add').addEventListener('click', _iconAddClick);
            $form.querySelector('.icon-delete').addEventListener('click', _iconDeleteClick);
            $form.addEventListener('submit', _submitAddStation);
        });
        $station.appendChild($edit);
    }
    const $title = document.createElement('h3');
    $title.className = 'title';
    $title.textContent = station.title;
    $station.appendChild($title);

    return $station;
}

async function _submitAddStation(e) {
    e.preventDefault();
    const $form = e.target;

    const station = {
        name: $form.dataset.name,
        title: $form.querySelector('[name=title]').value,
        url: $form.querySelector('[name=url]').value,
        image: $form.querySelector('[name=image]').value,
        streams: Array.from($form.querySelectorAll('[name=streams]')).map((item) => item.value),
    };

    await sendMessageToBackground('addStation', station);
    await renderStations();
    openStationsTab();
}

function _iconAddClick(e) {
    e.preventDefault();
    const $streams = e.target.parentNode;
    const $input = $streams.querySelector('[name=streams]');
    const $newInput = $input.cloneNode(true);
    $newInput.value = '';
    $input.after($newInput);
}

function _iconDeleteClick(e) {
    e.preventDefault();
    const $streams = e.target.parentNode;
    const $inputs = $streams.querySelectorAll('input');
    const $input = $inputs[$inputs.length - 1];
    $input.parentNode.removeChild($input);
}

/**
 * Open tab from hash.
 */
function openTab() {
    if (!window.location.hash) {
        return;
    }

    var hash = window.location.hash.substring(1);
    hash = hash.split('#');

    switch (hash[0]) {
        case 'add':
            openAddStationTab.apply(null, hash);
            break;
        case 'changelog':
            document.querySelector('#changelog .message').style.display = 'block';
            openChangelogTab();
            break;
        default:
            openStationsTab();
    }
}

/**
 * Get form template from head.
 * @return {HTMLElement}
 */
function getFormTemplate() {
    const template = document.querySelector("#addStation");
    const $template = template.content.cloneNode(true);
    translateAll($template);
    return $template;
}

/**
 * Open add station page.
 * @param {Event|string=} event
 * @param {string=} title
 * @param {string=} stream
 * @param {string=} url
 */
function openAddStationTab(event, title, stream, url) {
    const $template = getFormTemplate();
    const $page = document.querySelector('section[data-page="add"]');

    if (typeof event === 'string') {
        $template.querySelector('[name="title"]').value = title || '';
        $template.querySelector('[name="streams"]').value = stream || '';
        $template.querySelector('[name="url"]').value = url || '';
    }

    document.body.dataset.page = 'add';
    const $addStation = $page.querySelector('.addStation');
    $addStation?.parentNode.removeChild($addStation);
    $page.appendChild($template);

    const $streams = $page.querySelector('.field-streams');
    $streams.querySelector('.icon-add').addEventListener('click', _iconAddClick);
    $streams.querySelector('.icon-delete').addEventListener('click', _iconDeleteClick);
    $page.querySelector('.addStation').addEventListener('submit', _submitAddStation);
}

/**
 * Open stations list page.
 */
function openStationsTab() {
    document.body.dataset.page = 'stations';
    const $page = document.querySelector('section[data-page="stations"]');
    $page.querySelector('.edit')?.classList.remove('edit');
    const addStation = $page.querySelector('.addStation');
    addStation?.parentNode.removeChild(addStation);
}

/**
 * Open changelog page.
 */
function openChangelogTab() {
    document.body.dataset.page = 'changelog';
}

/**
 * Open hotkeys options.
 */
function openHotkeysTab() {
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
}

/**
 * Open export page.
 */
async function openExportTab() {
    document.body.dataset.page = 'export';
    const $page = document.getElementById('export');
    $page.querySelector('.export > textarea').value = await sendMessageToBackground('exportData');
}

/**
 * Open import page.
 */
function openImportTab() {
    document.body.dataset.page = 'import';
}

/**
 * Renders stations list.
 */
async function renderStations() {
    const $coreStationsContainer = document.getElementById('corestations');
    $coreStationsContainer.innerHTML = '';
    const $userStationsContainer = document.getElementById('userstations');
    $userStationsContainer.innerHTML = '';
    const $userStationsTitle = document.getElementById('userstations-title');
    const $hiddenStationsContainer = document.getElementById('hiddenstations');
    $hiddenStationsContainer.innerHTML = '';
    const $hiddenStationsTitle = document.getElementById('hiddenstations-title');
    const stations = await sendMessageToBackground('getStations') || {};

    for (const station of Object.values(stations)) {
        const rendered = renderStation(station.name, station);
        if (station.isHidden) {
            $hiddenStationsContainer.appendChild(rendered);
        } else if (station.isUser) {
            $userStationsContainer.appendChild(rendered);
        } else {
            $coreStationsContainer.appendChild(rendered);
        }
    }

    $userStationsTitle.style.display = $userStationsContainer.innerHTML ? 'block' : 'none';
    $hiddenStationsTitle.style.display = $hiddenStationsContainer.innerHTML ? 'block' : 'none';
}

/**
 * Init events.
 */
function initEvents() {
    // Menu
    const $menu = document.querySelector('ul.menu');
    $menu.querySelector('li[data-page="add"]').addEventListener('click', openAddStationTab);
    $menu.querySelector('li[data-page="stations"]').addEventListener('click', openStationsTab);
    $menu.querySelector('li[data-page="hotkeys"]').addEventListener('click', openHotkeysTab);
    $menu.querySelector('li[data-page="export"]').addEventListener('click', openExportTab);
    $menu.querySelector('li[data-page="import"]').addEventListener('click', openImportTab);
    $menu.querySelector('li[data-page="changelog"]').addEventListener('click', openChangelogTab);

    // Import Page
    const $importPage = document.getElementById('import');
    const $importError = $importPage.querySelector('.error');
    const $importSuccess = $importPage.querySelector('.success');
    const $importTextarea = $importPage.querySelector('textarea');

    const importButtonState = () => {
        const $btn = $importPage.querySelector('.importdata');
        if ($importTextarea.value.trim()) {
            $btn.removeAttribute('disabled');
        } else {
            $btn.setAttribute('disabled', 'disabled');
        }
    };

    $importPage.querySelector('.loadfile').addEventListener('click', (e) => {
        e.preventDefault();
        _getFileContent((data) => {
            if (data) {
                $importTextarea.value = data;
                importButtonState();
                $importError.style.display = 'none';
            } else {
                $importSuccess.style.display = 'none';
                $importError.style.display = 'block';
            }
        });
    });

    $importPage.querySelector('.importdata').addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await sendMessageToBackground('importData', $importTextarea.value);
        $importError.style.display = result ? 'none' : 'block';
        $importSuccess.style.display = result ? 'block' : 'none';
        await renderStations();
    });

    for (const e of ['input', 'propertychange', 'paste']) {
        $importTextarea.addEventListener(e, importButtonState);
    }

    // Export Page
    const $exportPage = document.getElementById('export');
    $exportPage.querySelector('.savefile').addEventListener('click', async (e) => {
        e.preventDefault();
        const data = await sendMessageToBackground('exportData');
        _saveOptionsFile(data);
    });
}
(async () => {
    openTab();
    await renderStations();
    initEvents();
    translateAll();
})();
