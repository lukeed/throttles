import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { sleep, inRange, timer } from './utils';
import throttle from '../src/single';

test('exports', () => {
	assert.type(throttle, 'function');
});

test('returns', () => {
	const out = throttle();
	assert.ok(Array.isArray(out), 'returns an Array');
	assert.is(out.length, 2, '~> has two items');

	out.forEach(item => {
		assert.type(item, 'function');
	});
});

test('usage :: default limit', async () => {
	let last, num=5, step=500;
	const [toAdd, isDone] = throttle();

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(demo));

	await sleep(++num * step);

	const bool = inRange(last, 2500);
	assert.ok(bool, '~> ran 1 at a time');
});

test('usage :: custom limit', async () => {
	let last, num=10, step=500;
	const [toAdd, isDone] = throttle(5);

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(demo));

	await sleep(++num * step);

	const bool = inRange(last, 1000);
	assert.ok(bool, '~> ran 5 at a time');
});

test.run();
