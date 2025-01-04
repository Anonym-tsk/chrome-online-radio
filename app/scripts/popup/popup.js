import {translate, translateAll} from '../common/Translator.js';
import {sendMessageToOffscreen} from "../common/Utils";

/**
 * Stations container.
 * @type {HTMLElement}
 * @private
 */
const $stations = document.getElementById('stations');

/**
 * Favorites container.
 * @type {HTMLElement}
 * @private
 */
const $favorites = document.getElementById('favorites');

/**
 * Player container
 * @type {HTMLElement}
 * @private
 */
const $player = document.getElementById('player');

const $footer = document.getElementById('footer');

const $search = document.getElementById('search');

/**
 * Renders adding station to favorites.
 * @param {string} name
 * @private
 */
function renderLike(name) {
    const $station = $stations.querySelector('.station[data-name="' + name + '"]');
    const height = $station.offsetHeight;
    const top = $station.offsetTop;

    $station.classList.add('favorite');
    $station.classList.add('move');

    $station.addEventListener('transitionend', function trEnd(e) {
        if (e.propertyName !== 'transform') {
            return;
        }
        $station.removeEventListener('transitionend', trEnd);

        $favorites.classList.remove('move');
        $favorites.style.paddingTop = 0;
        $favorites.prepend($station);
        $station.style.transform = 'none';
        $station.style.marginBottom = 0;
        $station.classList.remove('move');
    });

    $stations.scrollTop = 0;
    $favorites.classList.add('move');
    $favorites.style.paddingTop = `${height}px`;
    $station.style.transform = `translateY(-${top + height}px)`;
    $station.style.marginBottom = `-${height}px`;

    if ($player.dataset.name === name) {
        $player.classList.add('favorite');
    }
}

/**
 * Renders removing station from favorites.
 * @param {string} name
 * @private
 */
function renderDislike(name) {
    const $station = document.querySelector('.station[data-name="' + name + '"]');
    const height = $station.offsetHeight;
    const top = $station.offsetTop;
    const newTop = $favorites.offsetHeight - height - top;

    $station.classList.remove('favorite');
    $station.classList.add('move');

    $station.addEventListener('transitionend', function trEnd(e) {
        if (e.propertyName !== 'transform') {
            return;
        }
        $station.removeEventListener('transitionend', trEnd);

        $favorites.classList.remove('move');
        $favorites.style.paddingBottom = 0;
        $favorites.after($station);
        $station.style.transform = 'none';
        $station.style.marginBottom = 0;
        $station.classList.remove('move');
    });

    $station.style.transform = `translateY(${newTop}px)`;
    $station.style.marginBottom = `-${height}px`;

    $favorites.classList.add('move');
    $favorites.style.paddingBottom = `${height}px`;

    if ($player.dataset.name === name) {
        $player.classList.remove('favorite');
    }
}

/**
 * Renders one station for stations list.
 * @param {string} name
 * @param {string} title
 * @param {string} image
 * @param {boolean} favorite
 * @return {HTMLElement}
 * @private
 */
function renderStation(name, title, image, favorite) {
    const $station = document.createElement('div');
    $station.className = 'station';
    $station.dataset.name = name;
    if (favorite) {
        $station.classList.add('favorite');
    }

    const $image = document.createElement('div');
    $image.className = 'image';
    $station.appendChild($image);

    const $play = document.createElement('i');
    $play.className = 'icon icon-play';
    $play.title = translate('play');
    $station.appendChild($play);

    const $stop = document.createElement('i');
    $stop.className = 'icon icon-stop';
    $stop.title = translate('stop');
    $station.appendChild($stop);

    const $like = document.createElement('i');
    $like.className = 'icon icon-like';
    $like.title = translate('like');
    $station.appendChild($like);

    const $dislike = document.createElement('i');
    $dislike.className = 'icon icon-dislike';
    $dislike.title = translate('dislike');
    $station.appendChild($dislike);

    const $title = document.createElement('h3');
    $title.className = 'title';
    $title.textContent = title;
    $station.appendChild($title);

    setTimeout(() => {
        $image.style.backgroundImage = image ? 'url(' + image + ')' : '';
    }, 50);

    return $station;
}

/**
 * Renders visualization.
 * @private
 */
function renderEqualizer() {
    const $container = $player.querySelector('.equalizer');

    const BAR_WIDTH = 3; // Ширина полоски
    const SPACER_WIDTH = 1; // Ширина отступа
    const EMPTY_HEIGHT = 1; // Высота "пустого" бара
    const CANVAS_WIDTH = $container.offsetWidth
    const CANVAS_HEIGHT = $container.offsetHeight;
    const NUM_BARS = Math.round(CANVAS_WIDTH / (SPACER_WIDTH + BAR_WIDTH));

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    $container.appendChild(canvas);

    // Canvas context
    const canvasContext = canvas.getContext('2d');
    const gradient = canvasContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(1, '#0088cc');
    gradient.addColorStop(0.5, '#00719f');
    gradient.addColorStop(0, '#005E84');
    canvasContext.fillStyle = gradient;

    // First render
    for (let i = 0; i < NUM_BARS; ++i) {
        canvasContext.fillRect(
            i * (SPACER_WIDTH + BAR_WIDTH),
            CANVAS_HEIGHT,
            BAR_WIDTH,
            -EMPTY_HEIGHT
        );
    }

    (async function drawFrame() {
        if (!$player.classList.contains('playing')) {
            canvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - EMPTY_HEIGHT);
            window.requestAnimationFrame(drawFrame);
            return;
        }

        const freqByteData = await sendMessageToOffscreen('getAudioData');
        canvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - EMPTY_HEIGHT);

        if (!freqByteData) {
            window.requestAnimationFrame(drawFrame);
            return;
        }

        for (let i = 0; i < NUM_BARS; ++i) {
            const magnitude = Math.ceil(freqByteData[i] * CANVAS_HEIGHT / 255); // 255 is the maximum magnitude of a value in the frequency data
            canvasContext.fillRect(
                i * (SPACER_WIDTH + BAR_WIDTH),
                CANVAS_HEIGHT,
                BAR_WIDTH,
                -magnitude
            );
        }

        window.requestAnimationFrame(drawFrame);
    })();
}

/**
 * Set volume.
 * @param {number} volume
 * @param {boolean=} setInputValue
 * @param {boolean=} renderOnly
 * @private
 */
function setVolume(volume, setInputValue, renderOnly) {
    const $mute = $player.querySelector('.icon-mute');
    const $unmute = $player.querySelector('.icon-unmute');
    $mute.style.display = 'block';
    $unmute.style.display = 'none';

    volume = volume < 0 ? 0 : Math.min(volume, 100);

    if (!volume) {
        $mute.style.display = 'none';
        $unmute.style.display = 'block';
    }
    if (setInputValue) {
        $player.querySelector('.volume > input').value = volume;
    }
    if (!renderOnly) {
        sendMessageToOffscreen('volume', String(volume));
    }
}

/**
 * Renders stations list.
 * @private
 */
async function renderStationsList() {
    const stations = await sendMessageToBackground('getStations');
    const favorites = await sendMessageToBackground('getFavorites');

    for (let i = 0, l = favorites.length; i < l; i++) {
        const name = favorites[i];
        if (stations.hasOwnProperty(name) && !stations[name].isHidden) {
            $favorites.prepend(renderStation(name, stations[name].title, stations[name].image, true));
        }
    }

    for (let n in stations) {
        if (stations.hasOwnProperty(n) && favorites.indexOf(n) < 0 && !stations[n].isHidden) {
            $stations.append(renderStation(stations[n].name, stations[n].title, stations[n].image, false));
        }
    }
}

/**
 * Init events.
 */
function initEvents() {
    $stations.querySelectorAll('.station').forEach(($station) => {
        $station.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessageToOffscreen('play', $station.dataset.name);
        });

        $station.querySelector('.icon-like').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendMessageToBackground('like', $station.dataset.name);
            renderLike($station.dataset.name);
        });

        $station.querySelector('.icon-dislike').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendMessageToBackground('dislike', $station.dataset.name);
            renderDislike($station.dataset.name);
        });
    });

    $player.querySelector('.title').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.classList.contains('link')) {
            sendMessageToBackground('link', $player.dataset.name);
        }
    });

    $player.querySelector('.icon-like').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendMessageToBackground('like', $player.dataset.name);
        renderLike($player.dataset.name);
    });

    $player.querySelector('.icon-dislike').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendMessageToBackground('dislike', $player.dataset.name);
        renderDislike($player.dataset.name);
    });

    $player.querySelector('.volume > input').addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setVolume(e.target.value);
    });

    $player.querySelector('.icon-mute').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setVolume(0, true);
    });

    $player.querySelector('.icon-unmute').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setVolume(await sendMessageToBackground('getVolumeLast'), true);
    });

    $player.addEventListener('mousewheel', async (e) => {
        e.preventDefault();
        const volume = await sendMessageToBackground('getVolume');
        const step = 5;
        const delta = e.wheelDelta;

        if (delta > 0 && volume < 100) {
          setVolume(volume + step, true);
        }
        else if (delta < 0 && volume > 0) {
          setVolume(volume - step, true);
        }
    });

    $player.querySelector('.icon-play-big').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendMessageToOffscreen('play', $player.dataset.name);
    });

    $player.querySelector('.icon-stop-big').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendMessageToOffscreen('play', $player.dataset.name);
    });

    $footer.querySelector('.icon-options').addEventListener('click', (e) => {
        e.preventDefault();
        sendMessageToBackground('options');
    });

    $footer.querySelector('.icon-add').addEventListener('click', (e) => {
        e.preventDefault();
        sendMessageToBackground('options', 'add');
    });

    $footer.querySelector('.icon-feedback').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({url: 'mailto:chrome@vasilchuk.net?Subject=Online%20Radio%20Extension'});
    });

    const $searchBox = $search.querySelector('.search');
    const searchHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const value = $searchBox.value.toLowerCase();

        $stations.querySelectorAll('.station').forEach(($station) => {
            const match = $station.querySelector('.title').textContent.toLowerCase().indexOf(value) >= 0;
            $station.style.display = match ? 'block' : 'none';
        });
    };
    $searchBox.addEventListener('keyup', searchHandler);
    $searchBox.addEventListener('paste', searchHandler);
    $searchBox.addEventListener('search', searchHandler);
    $searchBox.addEventListener('blur', searchHandler);
}

/**
 * Set player state.
 * @param {string=} state
 */
async function setPlayerState(state) {
    state = state || await sendMessageToOffscreen('getStatus');
    const start = async () => {
        stop();
        const station = await sendMessageToBackground('getLastStation');
        if (!station) {
            return;
        }

        const $station = document.querySelector('.station[data-name="' + station.name + '"]');
        const $description = $player.querySelector('.description');

        $station.classList.add('active');
        $description.textContent = '';

        $player.classList.add('buffering', 'ready');
        $player.classList.toggle('favorite', $station.classList.contains('favorite'));
        $player.dataset.name = station.name;

        const $title = $player.querySelector('.title');
        $title.textContent = station.title;
        $title.classList.remove('link');

        if (station.url) {
            $title.classList.add('link');
            $title.setAttribute('title', translate('link'));
        }

        setTimeout(() => {
            const $image = $player.querySelector('.image');
            $image.style.backgroundImage = station.image ? 'url(' + station.image + ')' : '';
        }, 50);

        const names = Object.keys(station.streams);
        names.forEach((name) => {
            const $button = document.createElement('button');
            $button.className = 'quality';
            $button.classList.toggle('__active', station.streamName === name);
            $button.textContent = isFinite(name) ? '♬' : name;
            $button.setAttribute('title', station.streams[name]);
            $button.dataset.name = name;
            $button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                sendMessageToOffscreen('stream', name);
            });

            $description.appendChild($button);
        });
    };

    const error = () => {
        stop();
        $player.classList.add('error');
    };

    const stop = () => {
        document.querySelector('.active')?.classList.remove('active');
        $player.classList.remove('buffering', 'playing', 'error');
    };

    const play = function() {
        $player.classList.remove('buffering', 'error');
        $player.classList.add('playing');
    };

    if (!$player.classList.contains('ready') && state !== 'buffering') {
        await start();
    }

    switch (state) {
        case 'buffering':
            await start();
            break;
        case 'playing':
            play();
            break;
        case 'stopped':
            stop();
            break;
        case 'error':
            error();
            break;
    }
}

/**
 * Scroll popup to current station.
 */
async function scrollToLastStation() {
    const station = await sendMessageToBackground('getLastStation');
    if (!station) {
        return;
    }

    const $station = document.querySelector('.station[data-name="' + station.name + '"]');
    $stations.scrollTop = $stations.scrollTop + $station.offsetTop - $station.offsetHeight;
}

// Listen messages from background
chrome.runtime.onMessage.addListener((message) => {
    if (message.target !== 'popup') {
        return;
    }
    console.log('Message to popup', message);
    setPlayerState(message.action);
});

(async () => {
    await renderStationsList();
    translateAll();
    initEvents();
    setVolume(await sendMessageToBackground('getVolume'), true, true);
    renderEqualizer();
    await setPlayerState();
    await scrollToLastStation();
})();


