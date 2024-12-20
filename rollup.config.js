import terser from '@rollup/plugin-terser';

export default [{
	input: 'geoutils.js',
	output: [{
		file: 'geoutils.cjs',
		format: 'cjs',
	}, {
		file: 'geoutils.min.js',
		format: 'esm',
		plugins: [terser()],
		sourcemap: true,
	}],
}];
