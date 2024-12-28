export const EARTH_RADIUS_METERS = 6371000;
export const RADIANS_PER_DEGREE = Math.PI / 180;
export const METERS_PER_DEGREE = 111321;
export const BASE32_ALPHABET = '0123456789bcdefghjkmnpqrstuvwxyz';
export const BASE32_TABLE = Object.fromEntries(BASE32_ALPHABET.split('').map((char, idx) => [char, idx]));
export const MAX_LAT = 90;
export const MIN_LAT = -90;
export const MAX_LON = 180;
export const MIN_LON = -180;
