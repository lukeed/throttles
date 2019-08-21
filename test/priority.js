import test from 'tape';
import throttle from '../src/priority';
import { sleep, inRange, timer } from './utils';

test('(priority) exports', t => {
	t.is(typeof throttle, 'function');
	t.end();
});

test('(priority) returns', t => {
	const out = throttle();
	t.true(Array.isArray(out), 'returns an Array');
	t.is(out.length, 2, '~> has two items');

	t.true(
		out.every(x => typeof x === 'function'),
		'~> both are functions'
	);

	t.end();
});

test('(priority) usage :: discard repeats', async t => {
	let last, num=5, step=500;
	const [toAdd, isDone] = throttle();

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(demo));

	await sleep(++num * step);

	const bool = inRange(last, 500);
	t.true(bool, '~> ONLY RAN 1 ITEM');

	t.end();
});

test('(priority) usage :: default limit', async t => {
	let last, num=5, step=500;
	const [toAdd, isDone] = throttle();

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(() => demo())); // new function per add

	await sleep(++num * step);

	const bool = inRange(last, 2500);
	t.true(bool, '~> ran 1 at a time');

	t.end();
});

test('(priority) usage :: custom limit', async t => {
	let last, num=10, step=500;
	const [toAdd, isDone] = throttle(5);

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(() => demo())); // new function per add

	await sleep(++num * step);

	const bool = inRange(last, 1000);
	t.true(bool, '~> ran 5 at a time');

	t.end();
});

test('(priority) isHigh :: init', async t => {
	t.plan(5);

	let last, low=0, num=3, step=500;
	const [toAdd, isDone] = throttle(1);

	const t1 = timer();

	const toLow = () => (last = t1(), low++);
	const isLow = () => sleep(step).then(toLow).then(isDone);

	const isHigh = () => sleep(step).then(() => {
		t.true(low <= 1, '~> high-priority item ran before low-priotity queue finished');
		last = t1();
		isDone();
	});

	// Add 3 low-priority items first
	Array.from({ length: num }, () => {
		toAdd(() => isLow()); // new function per add
	});

	// Then add 3 high-priority items
	Array.from({ length: num }, () => {
		toAdd(() => isHigh(), true); // new function per add
	});

	await sleep((2*num + 1) * step);
	t.is(low, 3, '~> eventually ran all low-priority items');

	const bool = inRange(last, 3000);
	t.true(bool, '~> ran 1 at a time');
});

test('(priority) isHigh :: upgrade', async t => {
	t.plan(9);

	let last, low=0, high=0, step=500;
	const [toAdd, isDone] = throttle(1);

	// Make sure right functions are called
	let aaa=0, bbb=0, ccc=0, ddd=0, eee=0;

	const t1 = timer();
	const toLow = () => (last = t1(), low++);

	// [isLow, isLow, isLow, isLow, isHigh]
	const items = [
		() => sleep(step).then(() => aaa=1).then(toLow).then(isDone),
		() => sleep(step).then(() => bbb=1).then(toLow).then(isDone),
		() => sleep(step).then(() => ccc=1).then(toLow).then(isDone),
		() => sleep(step).then(() => ddd=1).then(toLow).then(isDone),
		() => sleep(step).then(() => eee=1).then(() => {
			t.true(low <= 1, '~> high-priority item ran before low-priotity queue finished');
			last = t1();
			isDone();
			high++;
		})
	];

	// Add all `items` as low-priority
	items.forEach(fn => toAdd(fn));

	// Re-add the last item as high-priority – upgrades!
	toAdd(items[4], true);

	await sleep(6 * step);

	t.is(low, 4, '~> ran 4 items as low-priority');
	t.is(high, 1, '~> ran 1 item as high-priority');

	t.is(aaa, 1, '~> ran the "aaa" function');
	t.is(bbb, 1, '~> ran the "bbb" function');
	t.is(ccc, 1, '~> ran the "ccc" function');
	t.is(ddd, 1, '~> ran the "ddd" function');
	t.is(eee, 1, '~> ran the "eee" function');

	const bool = inRange(last, 2500);
	t.true(bool, '~> ran 1 at a time');
});


test('(priority) isHigh :: but unseen!', async t => {
	t.plan(8);

	let last, low=0, high=0, step=500;
	const [toAdd, isDone] = throttle(1);

	// Make sure right functions are called
	let aaa=0, bbb=0, ccc=0, ddd=0;

	const t1 = timer();
	const toLow = () => (last = t1(), low++);

	// [isLow, isLow, isLow]
	const items = [
		() => sleep(step).then(() => aaa=1).then(toLow).then(isDone),
		() => sleep(step).then(() => bbb=1).then(toLow).then(isDone),
		() => sleep(step).then(() => ccc=1).then(toLow).then(isDone),
	];

	const custom = () => {
		return sleep(step).then(() => ddd=1).then(() => {
			t.true(low <= 1, '~> high-priority item ran before low-priotity queue finished');
			last = t1();
			isDone();
			high++;
		});
	};

	custom.__t = 1;

	// Add all `items` as low-priority
	items.forEach(fn => toAdd(fn));

	// Add a high-priority item we've not seen before
	// but that happens to have same minification property (unlikely, but hey)
	toAdd(custom, true);

	await sleep(5 * step);

	t.is(low, 3, '~> ran 3 items as low-priority');
	t.is(high, 1, '~> ran 1 item as high-priority');

	t.is(aaa, 1, '~> ran the "aaa" function');
	t.is(bbb, 1, '~> ran the "bbb" function');
	t.is(ccc, 1, '~> ran the "ccc" function');
	t.is(ddd, 1, '~> ran the "ddd" function');

	const bool = inRange(last, 2000);
	t.true(bool, '~> ran 1 at a time');
});
