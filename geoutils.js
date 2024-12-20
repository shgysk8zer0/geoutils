const EARTH_RADIUS_METERS = 6371e3;
const RADIANS_PER_DEGREE = Math.PI / 180;
// const EARTH_CIRCUMFERENCE_METERS = 40075017;
// const LATITUDE_DEGREES_TO_METERS = EARTH_CIRCUMFERENCE_METERS / 360;
const BASE32_ALPHABET = '0123456789bcdefghjkmnpqrstuvwxyz';
const BASE32_TABLE = Object.fromEntries(BASE32_ALPHABET.split('').map((char, idx) => [char, idx]));

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
		let lat = [-90.0, 90.0];
		let lon = [-180.0, 180.0];

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
	return getDistance(decodeGeohash(geohash1), decodeGeohash(geohash2), { highAccuracy});
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
 * @param {number} [precision=4] - The desired geohash precision (length).
 * @returns {string} The geohash string.
 */
export function encodeGeohash({ latitude, longitude }, precision = 4) {
	let idx = 0;
	let bit = 0;
	let evenBit = true;
	let geohash = '';

	let latMin = -90;
	let latMax = 90;
	let lonMin = -180;
	let lonMax = 180;

	// Here be dragons again
	while (geohash.length < precision) {
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
 */
export function estimateGeohashAccuracy(geohash) {
	return geohash.length > 10
		? (12000 / Math.pow(2, geohash.length)) * 0.8
		: 12000 / Math.pow(2, geohash.length);
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
