import { describe, test } from 'node:test';
import assert from 'node:assert';
import { encodeGeohash, decodeGeohash, getDistance, getGeohashDistance, estimateGeohashAccuracy, checkGeohash, getGeohashBounds, geohashToBytes } from './geoutils.js';

describe('GeoUtils Tests', () => {
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
		const accuracy = estimateGeohashAccuracy('u4pruydqqvj');

		assert.strictEqual(typeof accuracy, 'number', 'Accuracy should be a number');
		assert.strictEqual(accuracy, 4.6875, 'Accuracy should match known value');
		assert.strictEqual(estimateGeohashAccuracy('u4pruydqqv'), 11.71875, 'Accuracy should match known value');
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
});
