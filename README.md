# geoutils

A utility library for geolocation and geohashing in JavaScript.

[![CodeQL](https://github.com/shgysk8zer0/geoutils/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/shgysk8zer0/geoutils/actions/workflows/codeql-analysis.yml)
![Node CI](https://github.com/shgysk8zer0/geoutils/workflows/Node%20CI/badge.svg)
![Lint Code Base](https://github.com/shgysk8zer0/geoutils/workflows/Lint%20Code%20Base/badge.svg)

[![GitHub license](https://img.shields.io/github/license/shgysk8zer0/geoutils.svg)](https://github.com/shgysk8zer0/geoutils/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/shgysk8zer0/geoutils.svg)](https://github.com/shgysk8zer0/geoutils/commits/master)
[![GitHub release](https://img.shields.io/github/release/shgysk8zer0/geoutils?logo=github)](https://github.com/shgysk8zer0/geoutils/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/shgysk8zer0?logo=github)](https://github.com/sponsors/shgysk8zer0)

[![npm](https://img.shields.io/npm/v/@shgysk8zer0/geoutils)](https://www.npmjs.com/package/@shgysk8zer0/geoutils)
![node-current](https://img.shields.io/node/v/@shgysk8zer0/geoutils)
![npm bundle size gzipped](https://img.shields.io/bundlephobia/minzip/@shgysk8zer0/geoutils)
[![npm](https://img.shields.io/npm/dw/@shgysk8zer0/geoutils?logo=npm)](https://www.npmjs.com/package/@shgysk8zer0/geoutils)

[![GitHub followers](https://img.shields.io/github/followers/shgysk8zer0.svg?style=social)](https://github.com/shgysk8zer0)
![GitHub forks](https://img.shields.io/github/forks/shgysk8zer0/geoutils.svg?style=social)
![GitHub stars](https://img.shields.io/github/stars/shgysk8zer0/geoutils.svg?style=social)
[![Twitter Follow](https://img.shields.io/twitter/follow/shgysk8zer0.svg?style=social)](https://twitter.com/shgysk8zer0)

[![Donate using Liberapay](https://img.shields.io/liberapay/receives/shgysk8zer0.svg?logo=liberapay)](https://liberapay.com/shgysk8zer0/donate "Donate using Liberapay")
- - -

- [Code of Conduct](./.github/CODE_OF_CONDUCT.md)
- [Contributing](./.github/CONTRIBUTING.md)
<!-- - [Security Policy](./.github/SECURITY.md) -->

## Installation

```sh
npm install @shgysk8zer0/geoutils
```

## Usage

```javascript
import { getDistance, encodeGeohash, decodeGeohash, getGeohashDistance, checkLocation, checkGeohash, getGeohashBounds, estimateGeohashAccuracy } from '@shgysk8zer0/geoutils';

// Example usage
const distance = getDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 34.0522, longitude: -118.2437 }
);

const geohash = encodeGeohash({ latitude: 40.7128, longitude: -74.0060 });
const coordinates = decodeGeohash(geohash);
const geohashDistance = getGeohashDistance('dr5ru7', '9q5ctr');
const isWithinRadius = checkLocation(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 34.0522, longitude: -118.2437 },
  { radius: 5000000 }
);
const geohashBounds = getGeohashBounds('dr5ru7');
const geohashAccuracy = estimateGeohashAccuracy('dr5ru7');
```

## API

### `getDistance(coords1, coords2, options)`

| Parameter | Type | Description |
| --- | --- | --- |
| `coords1` | `object` | Object containing `latitude` and `longitude` of the first location. |
| `coords1.latitude` | `number` | Latitude of the first location. |
| `coords1.longitude` | `number` | Longitude of the first location. |
| `coords2` | `object` | Object containing `latitude` and `longitude` of the second location. |
| `coords2.latitude` | `number` | Latitude of the second location. |
| `coords2.longitude` | `number` | Longitude of the second location. |
| `options` | `object` | Optional parameters. |
| `options.highAccuracy` | `boolean` | Whether to use high accuracy (Haversine formula) or lower accuracy approximation. |

Returns the distance in meters.

### `encodeGeohash(location, precision)`

| Parameter | Type | Description |
| --- | --- | --- |
| `location` | `object` | Object containing `latitude` and `longitude`. |
| `location.latitude` | `number` | Latitude of the location. |
| `location.longitude` | `number` | Longitude of the location. |
| `precision` | `number` | Desired geohash precision (length). |

Returns the geohash string.

### `decodeGeohash(geohash)`

| Parameter | Type | Description |
| --- | --- | --- |
| `geohash` | `string` | The geohash to parse. |

Returns an object with `latitude` and `longitude`.

### `getGeohashDistance(geohash1, geohash2, options)`

| Parameter | Type | Description |
| --- | --- | --- |
| `geohash1` | `string` | The first geohash. |
| `geohash2` | `string` | The second geohash. |
| `options` | `object` | Optional parameters. |
| `options.highAccuracy` | `boolean` | Whether to use high accuracy (Haversine formula) or lower accuracy approximation. |

Returns the distance in meters.

### `checkLocation(location, location2, options)`

| Parameter | Type | Description |
| --- | --- | --- |
| `location` | `object` | Object containing `latitude` and `longitude` of the target location. |
| `location.latitude` | `number` | Latitude of the target location. |
| `location.longitude` | `number` | Longitude of the target location. |
| `location2` | `object` | Object containing `latitude` and `longitude` of the reference location. |
| `location2.latitude` | `number` | Latitude of the reference location. |
| `location2.longitude` | `number` | Longitude of the reference location. |
| `options` | `object` | Optional parameters. |
| `options.radius` | `number` | Radius in meters to check within. |
| `options.highAccuracy` | `boolean` | Whether to use high accuracy (Haversine formula) or lower accuracy approximation. |

Returns `true` if the location is within the specified radius, `false` otherwise.

### `checkGeohash(geohash, coords, options)`

| Parameter | Type | Description |
| --- | --- | --- |
| `geohash` | `string` | The geohash to check against. |
| `coords` | `object` | Object containing `latitude` and `longitude` of the coordinates. |
| `coords.latitude` | `number` | Latitude of the coordinates. |
| `coords.longitude` | `number` | Longitude of the coordinates. |
| `options` | `object` | Optional parameters. |
| `options.highAccuracy` | `boolean` | Whether to use high accuracy (Haversine formula) or lower accuracy approximation. |
| `options.radius` | `number` | Radius in kilometers to check within. |

Returns `true` if the geohash is within the specified radius, `false` otherwise.

### `getGeohashBounds(geohash)`

| Parameter | Type | Description |
| --- | --- | --- |
| `geohash` | `string` | The geohash to get bounds for. |

Returns an object with `latitude` and `longitude` bounds.

### `estimateGeohashAccuracy(geohash)`

| Parameter | Type | Description |
| --- | --- | --- |
| `geohash` | `string` | The geohash to estimate accuracy for. |

Returns the estimated accuracy in meters.
