import '@shgysk8zer0/polyfills';
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
	encodeGeohash, decodeGeohash, getDistance, getGeohashDistance, estimateGeohashAccuracy, checkGeohash,
	getGeohashBounds, geohashToBytes, estimateCoordinateAccuracy, calculateGeohashLength,
	getCurrentPositionHash, parseGeoURI, createGeoURI,
} from '@shgysk8zer0/geoutils/geoutils.js';

describe('GeoUtils Tests', () => {
	/**
	 * @type {GeolocationCoordinates}
	 */
	const geoCoords = {
		latitude: 57.64911,
		longitude: 10.40744,
		altitude: 42,
		accuracy: 0.0074, // Should result in geohash length of 11
		altitudeAccuracy: null,
		heading: null,
		speed: null,
	};

	globalThis.navigator = {
		geolocation: {
			async getCurrentPosition(success, fail) {
				return await Promise.try(() => success({ coords: geoCoords, timestamp: Date.now()})).catch(fail);
			}
		}
	};

	test('Check known geohash values', () => {
		const decoded = decodeGeohash('u4pruydqqvj'); //57.64911,10.40744

		assert.ok(typeof decoded === 'object', 'Decoded geohash should be an object');
		assert.strictEqual(typeof decoded.latitude, 'number', 'Decoded latitude should be a number');
		assert.strictEqual(typeof decoded.longitude, 'number', 'Decoded longitude should be a number');
		assert.strictEqual(decoded.latitude.toPrecision(7), '57.64911', 'Decoded latitude should match known value');
		assert.strictEqual(decoded.longitude.toPrecision(7), '10.40744', 'Decoded longitude should match known value');
	});

	test('Check geohash encoding', () => {
		const coords = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
		const hashLength = 8;
		const geohash = encodeGeohash(coords, hashLength);

		assert.strictEqual(typeof geohash, 'string', 'Generated geohash should be a string');
		assert.strictEqual(geohash.length, hashLength, `Generated geohash should be ${hashLength} characters long`);
		assert.strictEqual(geohash, '9q8yyk8y', 'Generated geohash should match known value');
	});

	test('Test distance calculation', () => {
		const coords1 = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
		const coords2 = { latitude: 34.0522, longitude: -118.2437 }; // Los Angeles
		const distance = getDistance(coords1, coords2, { highAccuracy: true });
		const approx = getDistance(coords1, coords2, { highAccuracy: false });
		assert.throws(() => decodeGeohash(null), { name: 'TypeError' });

		assert.strictEqual(typeof distance, 'number', 'Distance should be a number');
		assert.strictEqual(typeof approx, 'number', 'Approximate distance should be a number');
		assert.strictEqual(distance.toFixed(0), '559121', 'Distance should match known value');
		assert.strictEqual(getDistance({}, {}), NaN, 'Distance should be NaN');
	});

	test('Test distance calculation with geohashes', () => {
		const coords1 = '9q8yyk8y'; // San Francisco
		const coords2 = '9q5ctr18'; // Los Angeles
		const distance = getGeohashDistance(coords1, coords2, { highAccuracy: true });

		assert.strictEqual(typeof distance, 'number', 'Distance should be a number');
		// Distance differs slightly from direct calculation due to geohash precision
		assert.strictEqual(distance.toFixed(0), '559125', 'Distance should match known value');
	});

	test('Check geohash against coordinates', () => {
		const coords = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
		const geohash = '9q8yyk8y';
		const result = checkGeohash(geohash, coords);

		assert.strictEqual(typeof result, 'boolean', 'Result should be a boolean');
		assert.strictEqual(result, true, 'Result should be true');
	});

	test('Check geohash accuracy estimation', () => {
		const accuracy = estimateGeohashAccuracy('u4pruydq');

		assert.strictEqual(typeof accuracy, 'number', 'Accuracy should be a number');
		assert.strictEqual(accuracy, 19, 'Accuracy should match known value');
		assert.strictEqual(estimateGeohashAccuracy('u4pruydqqv'), 0.6, 'Accuracy should match known value');
	});

	test('Check geocoordiante accuracy estimation', () => {
		const coords = { latitude: 57.64911, longitude: 10.40744 };
		const accuracy = estimateCoordinateAccuracy(coords);
		assert.strictEqual(typeof accuracy, 'number', 'Accuracy should be a number.');
		assert.strictEqual(accuracy.toFixed(0), '1', '5 digits should be accurate to about a meter.');
	});

	test('Check geohash bounds', () => {
		const bounds = getGeohashBounds('u4pruydqqvj');

		assert.ok(typeof bounds === 'object', 'Bounds should be an object');
		assert.ok(typeof bounds.latitude === 'object', 'Latitude bounds should be an object');
		assert.ok(typeof bounds.longitude === 'object', 'Longitude bounds should be an object');
		assert.strictEqual(typeof bounds.latitude.min, 'number', 'Latitude min should be a number');
		assert.strictEqual(typeof bounds.latitude.max, 'number', 'Latitude max should be a number');
		assert.strictEqual(typeof bounds.longitude.min, 'number', 'Longitude min should be a number');
		assert.strictEqual(typeof bounds.longitude.max, 'number', 'Longitude max should be a number');
		assert.strictEqual(bounds.latitude.min.toFixed(6), '57.649110', 'Latitude min should match known value');
		assert.strictEqual(bounds.latitude.max.toFixed(6), '57.649111', 'Latitude max should match known value');
		assert.strictEqual(bounds.longitude.min.toFixed(6), '10.407439', 'Longitude min should match known value');
		assert.strictEqual(bounds.longitude.max.toFixed(6), '10.407440', 'Longitude max should match known value');
	});

	test('Check byte-array conversion', () => {
		const bytes = geohashToBytes('u4pruydqqvj');
		const expected = new Uint8Array([26, 4, 21, 23, 26, 30, 12, 22, 22, 27, 17]);

		assert.ok(bytes instanceof Uint8Array, 'Bytes should be an array');
		assert.strictEqual(bytes.length, expected.length, 'Bytes should be 11 bytes long');
		assert.deepStrictEqual(bytes, expected, 'Bytes should match known value');
	});

	test('Geohash generation accuracy should be what is expected.', () => {
		const fullHash = encodeGeohash({ latitude: 57.64911, loongitude: 10.40744 }, 12);

		for (let n = 1; n < 12; n++) {
			const hash = fullHash.substring(0, n);
			const accuracy = estimateGeohashAccuracy(hash);
			const length = calculateGeohashLength(accuracy);
			assert.strictEqual(length, n, `Estimated accuracy for a hash length should match [${hash}]`);
		}
	});

	test('Check geohash generation from the `navigator.geolocation` (mocked) API.', async () => {
		const hash = await getCurrentPositionHash();
		assert.strictEqual(hash, 'u4pruydqqvj', 'Hash should match expected value.');
	});

	test('Check `geo:` URI handling', () => {
		const params = { zoom: 7, query: 'foo', type: 'what?' };
		const uri = createGeoURI(geoCoords, params);
		const result = parseGeoURI(uri);

		assert.deepStrictEqual(result.coords, geoCoords, 'Should parse to identical `GeolocationCoordinates`');
		assert.deepStrictEqual(result.params, params, 'Should parse to identical params.');
	});

	test('Check distance estimations', () => {
		const EIFFEL_TOWER = { latitude: 48.8583736, longitude: 2.291901 };
		const ARC_DE_TRIOPHE = { latitude: 48.8738286, longitude: 2.2935378 };
		const EMPIRE_STATE = { latitude: 40.748440, longitude: -73.985664 };
		const TOWER_BRIDGE = { latitude: 51.505456, longitude: -0.075356 };

		const distances = [
			getDistance(EIFFEL_TOWER, ARC_DE_TRIOPHE), // Low accuracy estimation of short distance
			getDistance(EIFFEL_TOWER, ARC_DE_TRIOPHE, { highAccuracy: true }), // High accuracy ~ 1.68km as measured on Google Maps
			1_730, // Measured linear of 1.73km distance, according to Google Maps => 1,730 meters
			getDistance(EMPIRE_STATE, TOWER_BRIDGE), // Greater distance, low accuracy
			getDistance(EMPIRE_STATE, TOWER_BRIDGE, { highAccuracy: true }), // High accuracy - 3,459 miles, ~ 5,567km => 5,566,721 meters
			5_566_721, // 3,459 miles, ~ 5,567km
		];

		// Short distances likely affected by measurement errors and rounding issues. Uncertainty of 2.5 meters significantly affects results.
		assert.ok(Math.abs(distances[0] - distances[2]) / distances[2] < 0.005, 'Simple approximations at close distances should be < 0.5%.');
		assert.ok(Math.abs(distances[1] - distances[2]) / distances[2] < 0.005, 'Haversine approximations at close distances should be < 0.5%.');
		assert.ok(Math.abs(distances[3] - distances[5]) / distances[5] < 0.05, 'Larger distances should still be within 5%.');
		assert.ok(Math.abs(distances[4] - distances[5]) / distances[5] < 0.001, 'Large distance using Haversine formula should be < 0.1% error.');
	});
});
