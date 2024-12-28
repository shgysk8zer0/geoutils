import terser from '@rollup/plugin-terser';

const modules = ['consts', 'coords', 'hash', 'uri', 'utils'];
const external = (id, input) => id !== input;

export default [{
	input: 'geoutils.js',
	output: {
		file: 'geoutils.min.js',
		format: 'esm',
		plugins: [terser()],
		sourcemap: true,
	},
}, {
	input: 'geoutils.js',
	external,
	output: {
		file: 'geoutils.cjs',
		format: 'cjs',
	}
}, ...modules.map(path => ({
	input: `${path}.js`,
	external,
	output: {
		file: `${path}.cjs`,
		format: 'cjs',
	}
}))];
