import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { sleep, inRange, timer } from './utils';
import throttle from '../src/priority';

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

test('usage :: discard repeats', async () => {
	let last, num=5, step=500;
	const [toAdd, isDone] = throttle();

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(demo));

	await sleep(++num * step);

	const bool = inRange(last, 500);
	assert.ok(bool, '~> ONLY RAN 1 ITEM');
});

test('usage :: default limit', async () => {
	let last, num=5, step=500;
	const [toAdd, isDone] = throttle();

	const t1 = timer();
	const toSave = () => last = t1();
	const demo = () => sleep(step).then(toSave).then(isDone);
	Array.from({ length: num }, () => toAdd(() => demo())); // new function per add

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
	Array.from({ length: num }, () => toAdd(() => demo())); // new function per add

	await sleep(++num * step);

	const bool = inRange(last, 1000);
	assert.ok(bool, '~> ran 5 at a time');
});

test('isHigh :: init', async () => {
	let plan = 0;
	let last, low=0, num=3, step=500;
	const [toAdd, isDone] = throttle(1);

	const t1 = timer();

	const toLow = () => (last = t1(), low++);
	const isLow = () => sleep(step).then(toLow).then(isDone);

	const isHigh = () => sleep(step).then(() => {
		assert.ok(low <= 1, '~> high-priority item ran before low-priotity queue finished');
		last = t1();
		isDone();
		plan++;
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
	assert.is(low, 3, '~> eventually ran all low-priority items');

	const bool = inRange(last, 3000);
	assert.ok(bool, '~> ran 1 at a time');

	assert.is(plan, 3);
});

test('isHigh :: upgrade', async () => {
	let plan = 0;
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
			assert.ok(low <= 1, '~> high-priority item ran before low-priotity queue finished');
			last = t1();
			isDone();
			high++;
			plan++;
		})
	];

	// Add all `items` as low-priority
	items.forEach(fn => toAdd(fn));

	// Re-add the last item as high-priority – upgrades!
	toAdd(items[4], true);

	await sleep(6 * step);

	assert.is(low, 4, '~> ran 4 items as low-priority');
	assert.is(high, 1, '~> ran 1 item as high-priority');

	assert.is(aaa, 1, '~> ran the "aaa" function');
	assert.is(bbb, 1, '~> ran the "bbb" function');
	assert.is(ccc, 1, '~> ran the "ccc" function');
	assert.is(ddd, 1, '~> ran the "ddd" function');
	assert.is(eee, 1, '~> ran the "eee" function');

	const bool = inRange(last, 2500);
	assert.ok(bool, '~> ran 1 at a time');

	assert.is(plan, 1);
});


test('isHigh :: but unseen!', async () => {
	let plan = 0;
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
			assert.ok(low <= 1, '~> high-priority item ran before low-priotity queue finished');
			last = t1();
			isDone();
			high++;
			plan++;
		});
	};

	custom.__t = 1;

	// Add all `items` as low-priority
	items.forEach(fn => toAdd(fn));

	// Add a high-priority item we've not seen before
	// but that happens to have same minification property (unlikely, but hey)
	toAdd(custom, true);

	await sleep(5 * step);

	assert.is(low, 3, '~> ran 3 items as low-priority');
	assert.is(high, 1, '~> ran 1 item as high-priority');

	assert.is(aaa, 1, '~> ran the "aaa" function');
	assert.is(bbb, 1, '~> ran the "bbb" function');
	assert.is(ccc, 1, '~> ran the "ccc" function');
	assert.is(ddd, 1, '~> ran the "ddd" function');

	const bool = inRange(last, 2000);
	assert.ok(bool, '~> ran 1 at a time');

	assert.is(plan, 1);
});

test.run();
