export default class AudioPlayer {
    constructor(volume) {
        this._audioAnalyser = null;
        this._audio = new Audio();
        this._audio.preload = 'auto';
        this._audio.crossOrigin = 'anonymous';
        this.setVolume(volume);
    }

    /**
     * Attach event handler to player.
     * @param {string} name
     * @param {function} callback
     */
    attachEvent(name, callback) {
        switch (name) {
            case 'play':
            case 'playing':
            case 'abort':
            case 'volumechange':
                this._audio.addEventListener(name, callback);
                break;
            case 'error':
                this._audio.addEventListener('error', callback);
                this._audio.addEventListener('stalled', callback);
                break;
            default:
                console.warn('Unsupported event type', name);
        }
    }

    /**
     * Start playing.
     * @param {string=} url Stream (or file) url.
     */
    play(url) {
        url = url || this._audio.src;
        this._audio.src = url;
        this._audio.play().catch(function() {
            // pass
        });
    }

    /**
     * Stop playing.
     */
    stop() {
        this._audio.pause();
        this._audio.src = '';
    }

    /**
     * Set player volume.
     * @param {number} volume Volume value from 0 to 100.
     */
    setVolume(volume) {
        this._audio.volume = Number((volume / 100).toFixed(2));
    }

    /**
     * Get player volume.
     * @return {number}
     */
    getVolume() {
        return Math.round(this._audio.volume * 100);
    }

    /**
     * Is playing now?
     * @return {boolean}
     */
    isPlaying() {
        return !this._audio.paused && !this._audio.ended && (this._audio.readyState === 4 || this._audio.networkState === 2);
    }

    _getAudioAnalyser() {
        const context = new window.AudioContext();
        const analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 128;
        const source = context.createMediaElementSource(this._audio);
        source.connect(analyser);
        analyser.connect(context.destination);
        return analyser;
    }

    /**
     * Get audio data for equalizer.
     * @return {Uint8Array}
     */
    getAudioData() {
        if (!this._audioAnalyser) {
            this._audioAnalyser = this._getAudioAnalyser();
        }

        const freqByteData = new Uint8Array(this._audioAnalyser.frequencyBinCount);
        this._audioAnalyser.getByteFrequencyData(freqByteData);

        return freqByteData;
    }
}
