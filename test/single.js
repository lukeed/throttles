import test from 'tape';
import throttle from '../src/single';
import { sleep, inRange, timer } from './utils';

test('(single) exports', t => {
	t.is(typeof throttle, 'function');
	t.end();
});

test('(single) returns', t => {
	const out = throttle();
	t.true(Array.isArray(out), 'returns an Array');
	t.is(out.length, 2, '~> has two items');

	t.true(
		out.every(x => typeof x === 'function'),
		'~> both are functions'
	);

	t.end();
});

test('(single) usage :: default limit', async t => {
	let last, num=5, step=500;
	const [toAdd, isDone] = throttle();

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(demo));

	await sleep(++num * step);

	const bool = inRange(last, 2500);
	t.true(bool, '~> ran 1 at a time');

	t.end();
});

test('(single) usage :: custom limit', async t => {
	let last, num=10, step=500;
	const [toAdd, isDone] = throttle(5);

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(demo));

	await sleep(++num * step);

	const bool = inRange(last, 1000);
	t.true(bool, '~> ran 5 at a time');

	t.end();
});
