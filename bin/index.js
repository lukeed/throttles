/* eslint-disable no-console */
const { promisify } = require('util');
const { execFile } = require('child_process');
const premove = require('premove');

const run = promisify(execFile);
const bundt = require.resolve('bundt');

function capitalize(str) {
	return str[0].toUpperCase() + str.substring(1);
}

async function mode(name, toMove) {
	let { stdout } = await run(bundt, [`src/${name}.js`, '--minify']);

	let diff = 8 - name.length;
	let spacer1 = ' '.repeat(diff < 0 ? 0 : diff);
	let spacer2 = ' '.repeat(diff < 0 ? diff * -1 : 0);

	process.stdout.write(
		stdout.replace('Filename' + spacer2, capitalize(name) + spacer1)
	);

	// UMD should be "default" for unpkg access
	// ~> needs "index.js" since no "unpkg" key config
	// ~> drops CommonJS format
	if (toMove) {
		await run('mv', ['dist/index.min.js', 'dist/index.js']);
		await run('mv', ['dist', name]);
	}
}

(async function () {
	// Purge
	await premove('priority');
	await premove('dist');

	// Build modes (order matters)
	await mode('priority', true);
	await mode('single');
})().catch(err => {
	console.error('ERROR:', err);
	process.exit(1);
});
