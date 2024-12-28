import { MAX_LAT, MIN_LAT, MAX_LON, MIN_LON, BASE32_ALPHABET } from '@shgysk8zer0/geoutils/consts.js';

/**
 * Clamps a value between a minimum and maximum value.
 *
 * @private
 * @param {number} min The minimum value.
 * @param {number} value The value to clamp.
 * @param {number} max The maximum value.
 * @returns {number} The clamped value.
 */
export const clamp = Math.clamp instanceof Function ? Math.clamp : (min, value, max) => Math.min(Math.max(value, min), max);

/**
 * Check if `val` is between `min` and `max` (inclusive)
 *
 * @param {number} min - The min value
 * @param {number} val - The given value to check
 * @param {number} max - The max value
 * @returns {boolean} - If `val` is between `min` and `max`
 */
export const between = (min, val, max) => typeof val === 'number' & ! (val < min || val > max);

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
 * Checks if a given set of numbers are valid coordinates
 *
 * @param {number} latitude The latitude component
 * @param {number} longitude The longitude component
 * @returns {boolean} Whether or not the coordinates are possible/valid
 */
export const isValidCoordinate = (latitude, longitude) => between(MIN_LAT, latitude, MAX_LAT) && between(MIN_LON, longitude, MAX_LON);
