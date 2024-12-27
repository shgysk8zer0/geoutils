const EARTH_RADIUS_METERS = 6371000;
const RADIANS_PER_DEGREE = Math.PI / 180;
const METERS_PER_DEGREE = 111321;
const BASE32_ALPHABET = '0123456789bcdefghjkmnpqrstuvwxyz';
const BASE32_TABLE = Object.fromEntries(BASE32_ALPHABET.split('').map((char, idx) => [char, idx]));
const MAX_LAT = 90;
const MIN_LAT = -90;
const MAX_LNG = 180;
const MIN_LNG = -180;

/**
 * Clamps a value between a minimum and maximum value.
 *
 * @private
 * @param {number} min The minimum value.
 * @param {number} value The value to clamp.
 * @param {number} max The maximum value.
 * @returns {number} The clamped value.
 */
const _clamp = Math.clamp instanceof Function ? Math.clamp : (min, value, max) => Math.min(Math.max(value, min), max);

/**
 * Check if `val` is between `min` and `max` (inclusive)
 *
 * @param {number} min - The min value
 * @param {number} val - The given value to check
 * @param {number} max - The max value
 * @returns {boolean} - If `val` is between `min` and `max`
 */
const _between = (min, val, max) => ! (val < min || val > max);

/**
 * Decodes a geohash into latitude and longitude coordinates.
 *
 * @private
 * @param {string} geohash The geohash to decode.
 * @returns {[[number, number], [number, number]]} The latitude and longitude coordinates.
 * @throws {TypeError} If the geohash is not a string.
 */
function _decodeGeohash(geohash) {
	if (typeof geohash !== 'string' || geohash.length === 0) {
		throw new TypeError('Geohash must be a non-empty string.');
	} else {
		let even = true;
		let lat = [MIN_LAT, MAX_LAT];
		let lon = [MIN_LNG, MAX_LNG];

		// Here be dragons
		for (const char of geohash.toLowerCase()) {
			const idx = BASE32_TABLE[char];

			for (let i = 4; i >= 0; i--) {
				const bit = (idx >> i) & 1;

				if (even) {
					const mid = (lon[0] + lon[1]) / 2;

					if (bit === 1) {
						lon[0] = mid;
					} else {
						lon[1] = mid;
					}
				} else {
					const mid = (lat[0] + lat[1]) / 2;

					if (bit === 1) {
						lat[0] = mid;
					} else {
						lat[1] = mid;
					}
				}

				even = !even;
			}
		}

		return [lat, lon];
	}
}

/**
 * Get the distance between two sets of coordinates.
 *
 * @param {object} coords1 First set of coordinates.
 * @param {number} coords1.latitude First coordinate latitude.
 * @param {number} coords1.longitude First coordinate longitude.
 * @param {object} coords2 Second set of coordinates.
 * @param {number} coords2.latitude Second coordinate latitude.
 * @param {number} coords2.longitude Second coordinate longitude.
 * @param {object} options - Optional parameters.
 * @param {boolean} [options.highAccuracy=false] - Whether to use high accuracy (Haversine formula) or lower accuracy approximation.
 * @returns {number} The distance between the two sets of coordinates in meters.
 */
export function getDistance(
	{ latitude: lat1, longitude: lon1 },
	{ latitude: lat2, longitude: lon2 },
	{ highAccuracy = false } = {},
) {
	if (! (typeof lat1 === 'number' && typeof lon1 === 'number' && typeof lat2 === 'number' && typeof lon2 === 'number')) {
		return NaN;
	} else if (! highAccuracy) {
		// Approximation using Pythagoras' theorem with latitude correction
		const factor = 111.32 * Math.cos(((lat1 + lat2) / 2) * RADIANS_PER_DEGREE);
		return Math.hypot((lat2 - lat1) * 111, (lon2 - lon1) * factor);
	} else {
		const lat1Rad = _clamp(-90, lat1 * RADIANS_PER_DEGREE, 90);
		const lat2Rad = _clamp(-90, lat2 * RADIANS_PER_DEGREE, 90);
		const rads1 = _clamp(-180, (lat2 - lat1) * RADIANS_PER_DEGREE, 180);
		const rads2 = _clamp(-180, (lon2 - lon1) * RADIANS_PER_DEGREE, 180);
		const dist = Math.sin(rads1 / 2) * Math.sin(rads1 / 2) +
			Math.cos(lat1Rad) * Math.cos(lat2Rad) *
			Math.sin(rads2 / 2) * Math.sin(rads2 / 2);

		const angDist = 2 * Math.atan2(Math.sqrt(dist), Math.sqrt(1 - dist));

		return EARTH_RADIUS_METERS * angDist;
	}
}

/**
 * Computes the distance between two geohashes.
 *
 * @param {string} geohash1 The first geohash to compare.
 * @param {string} geohash2 The second geohash to compare.
 * @param {object} options Optional parameters.
 * @param {boolean} [options.highAccuracy=false] Whether to use high accuracy (Haversine formula) or lower accuracy approximation.
 * @returns {number} The distance between the two geohashes in meters.
 */
export function getGeohashDistance(geohash1, geohash2, { highAccuracy = false } = {}) {
	return getDistance(decodeGeohash(geohash1), decodeGeohash(geohash2), { highAccuracy });
}

/**
 * Checks if the given location is within a specified radius of the payload location.
 *
 * @param {object} location - The target location to check.
 * @param {number} location.latitude - The latitude of the target location.
 * @param {number} location.longitude - The longitude of the target location.
 * @param {object} location2 - The reference location in the payload.
 * @param {number} location2.latitude - The latitude of the reference location.
 * @param {number} location2.longitude - The longitude of the reference location.
 * @param {object} [options] - Optional parameters.
 * @param {number} [options.radius=100_000] - The radius in meters to check within.
 * @param {boolean} [options.highAccuracy=false] - Whether to use high accuracy (Haversine formula) or lower accuracy approximation.
 * @returns {boolean} - Returns true if the location is within the specified radius, false otherwise.
 */
export function checkLocation(
	{ latitude: lat, longitude: lon } = {},
	{ latitude, longitude } = {},
	{ radius = 100_000, highAccuracy = false } = {}
) {
	return radius > getDistance({ latitude, longitude }, { latitude: lat, longitude: lon }, { highAccuracy });
}

/**
 * Generates a geohash from latitude and longitude coordinates.
 *
 * @param {object} location - The location object.
 * @param {number} location.latitude - The latitude.
 * @param {number} location.longitude - The longitude.
 * @param {number} [accuracy=4] - The desired geohash precision (length).
 * @returns {string} The geohash string.
 */
export function encodeGeohash({ latitude, longitude }, accuracy = 4) {
	let idx = 0;
	let bit = 0;
	let evenBit = true;
	let geohash = '';

	let latMin = MIN_LAT;
	let latMax = MAX_LAT;
	let lonMin = MIN_LNG;
	let lonMax = MAX_LNG;

	// Here be dragons again
	while (geohash.length < accuracy) {
		if (evenBit) {
			const lonMid = (lonMin + lonMax) / 2;

			if (longitude > lonMid) {
				idx = idx * 2 + 1;
				lonMin = lonMid;
			} else {
				idx *= 2;
				lonMax = lonMid;
			}
		} else {
			const latMid = (latMin + latMax) / 2;

			if (latitude > latMid) {
				idx = idx * 2 + 1;
				latMin = latMid;
			} else {
				idx *= 2;
				latMax = latMid;
			}
		}

		evenBit = !evenBit;
		bit++;

		if (bit === 5) {
			geohash += BASE32_ALPHABET.charAt(idx);
			bit = 0;
			idx = 0;
		}
	}

	return geohash;
}

/**
 * Parses a geohash string into latitude and longitude coordinates.
 *
 * @param {string} geohash The geohash to parse.
 * @returns {{latitude: number, longitude: number}} The latitude and longitude of the geohash.
 * @throws {TypeError} If the geohash is not a string.
 */
export function decodeGeohash(geohash) {
	const [lat, lon] = _decodeGeohash(geohash);

	return {
		latitude: (lat[0] + lat[1]) / 2,
		longitude: (lon[0] + lon[1]) / 2
	};
}

/**
 * Returns the bounds of a geohash.
 *
 * @param {string} geohash The geohash to get bounds for.
 * @returns {{latitude: {min: number, max: number}, longitude: {min: number, max: number}}} The bounds of the geohash.
 */
export function getGeohashBounds(geohash) {
	const [lat, lon] = _decodeGeohash(geohash);

	return {
		latitude: { min: lat[0], max: lat[1] },
		longitude: { min: lon[0], max: lon[1] }
	};
}

/**
 * Checks if the given geohash is within a specified radius of the given coordinates.
 *
 * @param {string} geohash The geohash to check against.
 * @param {object} coords The coordinates to check against.
 * @param {number} coords.latitude The latitude of the coordinates.
 * @param {number} coords.longitude The longitude of the coordinates.
 * @param {object} [options] Optional parameters.
 * @param {boolean} [options.highAccuracy=false] Whether to use high accuracy (Haversine formula) or lower accuracy approximation.
 * @param {number} [options.radius=100] The radius in kilometers to check within.
 * @returns {boolean} Returns true if the geohash is within the specified radius, false otherwise.
 * @throws {TypeError} If the geohash is not a string or the coordinates are invalid.
 */
export function checkGeohash(geohash, coords, { highAccuracy = false, radius = 100 } = {}) {
	return checkLocation(decodeGeohash(geohash), coords, { highAccuracy, radius });
}

/**
 * Estimates the accuracy of a geohash in meters.
 *
 * @param {string} geohash The geohash to estimate accuracy for.
 * @returns {number} The estimated accuracy in meters.
 * @see https://gis.stackexchange.com/questions/115280/what-is-the-precision-of-geohash
 */
export function estimateGeohashAccuracy(geohash) {
	if (typeof geohash !== 'string') {
		return NaN;
	} else {
		switch(geohash.length) {
			case 0: return Infinity;
			case 1: return 25_000_000;
			case 2: return 630_000;
			case 3: return 78_000;
			case 4: return 20_000;
			case 5: return 2_400;
			case 6: return 610;
			case 7: return 76;
			case 8: return 19;
			case 9: return 2.4;
			case 10: return 0.6;
			case 11: return 0.0074;
			default: return 0;
		}
	}
}

/**
 * Get the accuracy/hash length to derive length of a geohash given meters
 *
 * @param {number} meters The meters to which you want the hash accurate.
 * @returns {number} [1-12] depending on the accuracy in meters given, or `NaN` if there was an error
 */
export function calculateGeohashLength(distanceInMeters) {
	if (typeof distanceInMeters !== 'number' || isNaN(distanceInMeters) || distanceInMeters < 0) {
		return NaN;
	} else if (distanceInMeters === Infinity) {
		return 0;
	} else if (distanceInMeters > 24_999_999) {
		return 1;
	} else if (distanceInMeters > 629_999) {
		return 2;
	} else if (distanceInMeters > 77_999) {
		return 3;
	} else if (distanceInMeters > 19_999) {
		return 4;
	} else if (distanceInMeters > 2_399) {
		return 5;
	} else if (distanceInMeters > 609) {
		return 6;
	} else if (distanceInMeters > 75) {
		return 7;
	} else if (distanceInMeters > 18) {
		return 8;
	} else if (distanceInMeters > 2.3) {
		return 9;
	} else if (distanceInMeters > 0.5) {
		return 10;
	} else if (distanceInMeters > 0.0073) {
		return 11;
	} else {
		return 12;
	}
}

/**
 * Estimates the accuracy of geo coordinates based on latitude correction and decimal length;
 *
 * @param {GeolocationCoordinates} coords
 * @param {number} coords.longitude The longitude value of the coordinates
 * @returns {number} The estimated precision of the cooordinates in meters
 * @see https://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude
 * @see https://xkcd.com/2170/
 */
export function estimateCoordinateAccuracy({ latitude, accuracy }) {
	if (typeof accuracy === 'number') {
		return accuracy;
	} if (typeof latitude !== 'number') {
		return estimateCoordinateAccuracy({ latitude: parseFloat(latitude) });
	} else if (Number.isNaN(latitude)) {
		return NaN;
	} else if (Number.isInteger(latitude)) {
		return METERS_PER_DEGREE * Math.cos(latitude * RADIANS_PER_DEGREE);
	} else {
		const longStr = latitude.toString();
		const decimalLength = longStr.length - longStr.indexOf('.') - 1;
		return METERS_PER_DEGREE * Math.cos(latitude * RADIANS_PER_DEGREE) / Math.pow(10, decimalLength);
	}
}

/**
 * Converts a geohash string to a byte array.
 *
 * @param {string} geohash The geohash to convert.
 * @returns {Uint8Array} The byte array representation of the geohash.
 */
export const geohashToBytes = geohash => Uint8Array.from(
	geohash.split(''),
	char => BASE32_ALPHABET.indexOf(char)
);

/**
 * Gets the current position of the user, asynchronously.
 *
 * @param {object} options - Options for the geolocation request.
 * @param {boolean} [options.enableHighAccuracy=false] - Whether to request high accuracy.
 * @param {number} [options.maximumAge=0] - The maximum age of a cached position.
 * @param {number} [options.timeout=Infinity] - The maximum time to wait for a position.
 * @returns {Promise<GeolocationPosition>} - A Promise that resolves with the geolocation position.
 * @throws {GeolocationPositionError} - If an error occurs during geolocation.
 */
export async function getCurrentPosition({ enableHighAccuracy = false, maximumAge = 0, timeout = Infinity } = {}) {
	const { resolve, reject, promise } = Promise.withResolvers();
	navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy, maximumAge, timeout });

	return promise;
}

/**
 * Gets the current position of the user as a geohash.
 *
 * @param {object} options - Options for the geolocation request.
 * @param {boolean} [options.enableHighAccuracy=false] - Whether to request high accuracy.
 * @param {number} [options.maximumAge=0] - The maximum age of a cached position.
 * @param {number} [options.timeout=Infinity] - The maximum time to wait for a position.
 * @returns {Promise<string>} - The geohash of the user's current position.
 * @throws {GeolocationPositionError} - If an error occurs during geolocation.
 */
export async function getCurrentPositionHash({ enableHighAccuracy = false, maximumAge = 0, timeout = Infinity } = {}) {
	const position = await getCurrentPosition({ enableHighAccuracy, maximumAge, timeout });
	const accuracy = calculateGeohashLength(position.coords.accuracy);

	return encodeGeohash(position.coords, accuracy);
}

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
	} else if (! (_between(MIN_LAT, latitude, MAX_LAT) && _between(MIN_LNG, longitude, MAX_LNG))) {
		throw new RangeError('Invalid latitude/longitude.');
	} else {
		let uriStr = typeof altitude === 'number' && altitude > 0
			? `geo:${latitude},${longitude},${altitude}`
			: `geo:${latitude},${longitude}`;

		if (typeof accuracy === 'number' && ! (accuracy < 0)) {
			uriStr += `;u=${accuracy}`;
		}

		const uri = new URL(uriStr);

		if (typeof zoom === 'number' && _between(1, zoom, 21)) {
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
					params.zoom = _clamp(1, parseInt(val), 21);
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

/**
 * Converts a Geo URI (geo:) to a geohash.
 *
 * @param {URL|string} uri - The Geo URI string or URL object.
 * @returns {string} - The geohash string.
 * @throws {TypeError} - If the provided URI is invalid or not a Geo URI.`
 */
export function geoURIToGeohash(uri) {
	const { coords: { latitude, longitude, accuracy } } = parseGeoURI(uri);
	const length = calculateGeohashLength(accuracy);

	return encodeGeohash({ latitude, longitude }, length);
}
