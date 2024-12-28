import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';

const modules = ['consts', 'coords', 'hash', 'uri', 'utils'];
const external = (id, input) => id !== input;

export default [{
	input: 'geoutils.js',
	plugins: [nodeResolve()],
	output: [
		{ file: 'geoutils.min.js', format: 'esm', plugins: [terser()], sourcemap: true },
		{ file: 'geoutils.cjs', format: 'cjs' }],
}, ...modules.map(path => ({
	input: `${path}.js`,
	external,
	output: { file: `${path}.cjs`, format: 'cjs' }
}))];
