import { MAX_LAT, MIN_LAT, MAX_LON, MIN_LON } from '@shgysk8zer0/geoutils/consts.js';
import { between, clamp } from '@shgysk8zer0/geoutils/utils.js';
import { decodeGeohash, estimateGeohashAccuracy } from '@shgysk8zer0/geoutils/geoutils.js';

/**
 * Creates a Geo URI (geo:) from given coordinates.
 *
 * @param {GeolocationCoordinates|object} coords - The coordinates object.
 * @param {number} coords.latitude - The latitude coordinate.
 * @param {number} coords.longitude - The longitude coordinate.
 * @param {number} [coords.altitude] - The altitude coordinate (optional).
 * @param {number} [coords.accuracy] - The accuracy of the coordinates (optional).
 * @param {object} [params] - Optional options object.
 * @param {number} [params.zoom] - The desired zoom level (optional).
 * @param {string} [params.query] - A search query for the location (optional).
 * @param {string} [params.type] - The type of location (e.g., 'poi', 'street') (optional).
 * @param {boolean} [parameters.googleMapsCompatible=false] - Makes URI compatible with Google Maps and cannot be used if `query` is set.
 * @returns {URL} - The generated Geo URI.
 * @throws {RangeError} - If the latitude or longitude values are invalid.
 */
export function createGeoURI({ latitude, longitude, altitude, accuracy }, { zoom, query, type, googleMapsCompatible = false, ...params } = {}) {
	if (typeof latitude !== 'number' || typeof longitude !== 'number') {
		return createGeoURI({ latitude: parseFloat(latitude), longitude: parseFloat(longitude )});
	} else if (! (between(MIN_LAT, latitude, MAX_LAT) && between(MIN_LON, longitude, MAX_LON))) {
		throw new RangeError('Invalid latitude/longitude.');
	} else {
		let uriStr = typeof altitude === 'number' && altitude > 0
			? `geo:${latitude},${longitude},${altitude}`
			: `geo:${latitude},${longitude}`;

		if (typeof accuracy === 'number' && ! (accuracy < 0)) {
			uriStr += `;u=${accuracy}`;
		}

		const uri = new URL(uriStr);

		if (typeof zoom === 'number' && between(1, zoom, 21)) {
			uri.searchParams.set('z', zoom);
		}

		if (googleMapsCompatible) {
			uri.searchParams.set('q', `${latitude},${longitude}`);
		} else if (typeof query === 'string') {
			uri.searchParams.set('q', query);
		}

		if (typeof type === 'string') {
			uri.searchParams.set('t', type);
		}

		Object.entries(params).forEach(([prop, val]) => uri.searchParams.set(prop, val));

		return uri;
	}
}

/**
 * Parses a Geo URI (geo:) and extracts coordinate information.
 *
 * @param {string|URL} uri - The Geo URI string or URL object.
 * @returns {{coords: GeolocationCoordinates, params: object}} - An object containing the parsed coordinates.
 * @throws {TypeError} - If the provided URI is invalid or not a Geo URI.
 */
export function parseGeoURI(uri) {
	if (typeof uri === 'string') {
		return parseGeoURI(URL.parse(uri));
	} else if (! (uri instanceof URL)) {
		throw new TypeError('Geo URI must be a URL object.');
	} else if (uri.protocol !== 'geo:' || uri.origin !== 'null') {
		throw new TypeError(`Invalid protocol: ${uri.protocol}`);
	} else {
		const [[latitude, longitude, altitude = null], ...entries] = uri.pathname.split(';')
			.map((param, i) => {
				if (i === 0) {
					return param.split(',', 3).map(c => parseFloat(c));
				} else {
					return param.split('=', 2);
				}
			});

		const { u: accuracy, ...params} = Object.fromEntries(entries);

		uri.searchParams.forEach((val, key) => {
			switch(key) {
				case 'z':
					params.zoom = clamp(1, parseInt(val), 21);
					break;

				case 'q':
					params.query = val;
					break;

				case 't':
					params.type = val;
					break;

				default:
					params[key] = val;
			}
		});

		const coords = { latitude, longitude, altitude, heading: null, altitudeAccuracy: null, speed: null, accuracy: parseFloat(accuracy) };

		return { coords, params };
	}
}

/**
 * Creates a Geo URI (geo:) from a given geohash.
 *
 * @param {string} hash - The geohash string.
 * @param {object} [options] - Optional options object.
 * @param {boolean} [options.googleMapsCompatible=false] - Makes URI compatible with Google Maps.
 * @param {number} [options.altitude] - The altitude coordinate (optional).
 * @param {number} [options.zoom] - The desired zoom level (optional).
 * @returns {URL} - The generated Geo URI.
 * @throws {TypeError} - If the provided URI is invalid or not a Geo URI.
 */
export function geoHashToGeoURI(hash, {
	googleMapsCompatible = false,
	altitude,
	zoom,
} = {}) {
	const { latitude, longitude } = decodeGeohash(hash);
	const accuracy = estimateGeohashAccuracy(hash);

	return createGeoURI({ latitude, longitude, altitude, accuracy }, { googleMapsCompatible, zoom });
}
