const test = require('tape');
const fn = require('../dist/throttles');

test('export', t => {
	t.is(typeof fn, 'function', 'exports a object');
	t.end();
});
