import { MAX_LAT, MIN_LAT, MAX_LON, MIN_LON, BASE32_ALPHABET, BASE32_TABLE } from '@shgysk8zer0/geoutils/consts.js';
import { checkLocation, getCurrentPosition, getDistance } from '@shgysk8zer0/geoutils/coords.js';
import { parseGeoURI } from '@shgysk8zer0/geoutils/uri.js';

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
		let lon = [MIN_LON, MAX_LON];

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
	let lonMin = MIN_LON;
	let lonMax = MAX_LON;

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
