/**
 * Array to object converter.
 * @param {[]} arr
 * @return {{}}
 * @private
 */
function _arrayToObject(arr) {
    return arr.reduce(function(o, v, i) {
        o[i] = v;
        return o;
    }, {});
}

/**
 * Station class.
 */
export default class Station {
    /**
     * @param name {string}
     * @param title {string}
     * @param url {string}
     * @param streams {{string: string}}
     * @param image {string}
     * @param isUserStation {boolean}
     * @param isHidden {boolean}
     */
    constructor(name, title, url, streams, image, isUserStation, isHidden) {
        this.name = name;
        this.title = title;
        this.url = url;
        this.streams = Array.isArray(streams) ? _arrayToObject(streams) : streams;
        this.image = image || '';
        this._userStation = !!isUserStation;
        this._hidden = !!isHidden;
        this._currentStreamName = '0';
    }

    getStreamName() {
        if (!this.streams[this._currentStreamName]) {
            const names = Object.keys(this.streams);
            this._currentStreamName = names[0].toString();
        }
        return this._currentStreamName;
    }

    getNextStream() {
        const names = Object.keys(this.streams);
        const index = names.indexOf(this._currentStreamName);
        const newIndex = (index + 1) % names.length;
        return this.getStream(names[newIndex]);
    }

    getStream(name) {
        if (typeof name !== 'undefined') {
            this._currentStreamName = name.toString();
        }
        return this.streams[this.getStreamName()];
    }

    isHidden() {
        return this._hidden;
    }

    setHidden(isHidden) {
        this._hidden = !!isHidden;
    }

    isUserStation() {
        return this._userStation;
    }

    isCoreStation() {
        return !this._userStation;
    }

    toJSON() {
        return JSON.stringify({
            name: this.name,
            title: this.title,
            url: this.url,
            image: this.image,
            streamName: this.getStreamName(),
            stream: this.getStream(),
            isUser: this.isUserStation(),
            isHidden: this.isHidden(),
        });
    }
}
