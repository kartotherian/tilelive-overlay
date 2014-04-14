var util = require('util'),
    mapnik = require('mapnik'),
    path = require('path'),
    geojsonhint = require('geojsonhint'),
    generateXML = require('./lib/generatexml.js'),
    url = require('url'),
    fs = require('fs');

module.exports = Source;

require('util').inherits(Source, require('events').EventEmitter);

/**
 * Create a new source that returns tiles from a simplestyle-supporting
 * GeoJSON object.
 *
 * @param {string} uri
 * @param {function} callback
 * @returns {undefined}
 */
function Source(id, callback) {
    var uri = normalizeURI(id);
    if (!uri || (uri.protocol && uri.protocol !== 'simple:')) {
        throw new Error('Only the simple protocol is supported');
    }

    var filename = path.resolve(uri.pathname);
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) return callback(err);
        if (geojsonhint.hint(data).length) {
            return callback('invalid geojson');
        }
        this._data = JSON.parse(data);
        this._xml = generateXML(this._data);
        callback(null, this);
    }.bind(this));
}

/**
 * Gets a tile from this source.
 *
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {function} callback
 */
Source.prototype.getTile = function(z, x, y, callback) {
    callback(null);
};

/**
 * Gets a grid from this source: this will always fail, because
 * this source does not provide grids.
 *
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {function} callback
 */
Source.prototype.getGrid = function(z, x, y, callback) {
    callback('This source does not provide grids');
};

/**
 * Gets info from this source: this will always fail, because
 * this source does not provide info.
 *
 * @param {function} callback
 */
Source.prototype.getInfo = function(callback) {
    callback('This source does not provide info');
};

/**
 * @param {object} tilelive
 */
Source.registerProtocols = function(tilelive) {
    tilelive.protocols['simple:'] = Source;
};

function normalizeURI(uri) {
    if (typeof uri === 'string') uri = url.parse(uri, true);
    if (uri.hostname === '.' || uri.hostname == '..') {
        uri.pathname = uri.hostname + uri.pathname;
        delete uri.hostname;
        delete uri.host;
    }
    if (typeof uri.pathname !== 'undefined') {
        uri.pathname = path.resolve(uri.pathname);
    }
    return uri;
}
