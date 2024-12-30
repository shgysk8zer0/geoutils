import { RADIANS_PER_DEGREE, EARTH_RADIUS_METERS, MAX_LAT, MIN_LAT, MAX_LON, MIN_LON, METERS_PER_DEGREE } from '@shgysk8zer0/geoutils/consts.js';
import { clamp } from '@shgysk8zer0/geoutils/utils.js';

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
		const latScale = Math.cos((lat1 + lat2) * RADIANS_PER_DEGREE / 2);
		const dLon = (lon2 - lon1) * RADIANS_PER_DEGREE * latScale;
		const dLat = (lat2 - lat1) * RADIANS_PER_DEGREE;

		return EARTH_RADIUS_METERS * Math.hypot(dLon, dLat);
	} else {
		const lat1Rad = clamp(MIN_LAT, lat1 * RADIANS_PER_DEGREE, MAX_LAT);
		const lat2Rad = clamp(MIN_LAT, lat2 * RADIANS_PER_DEGREE, MAX_LAT);
		const rads1 = clamp(MIN_LON, (lat2 - lat1) * RADIANS_PER_DEGREE, MAX_LON);
		const rads2 = clamp(MIN_LON, (lon2 - lon1) * RADIANS_PER_DEGREE, MAX_LON);
		const dist = Math.sin(rads1 / 2) * Math.sin(rads1 / 2) +
			Math.cos(lat1Rad) * Math.cos(lat2Rad) *
			Math.sin(rads2 / 2) * Math.sin(rads2 / 2);

		const angDist = 2 * Math.atan2(Math.sqrt(dist), Math.sqrt(1 - dist));

		return EARTH_RADIUS_METERS * angDist;
	}
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
