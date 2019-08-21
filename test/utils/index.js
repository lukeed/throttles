export function toDuration(arr) {
	return (arr[0]*1e3 + arr[1]/1e6).toFixed(2);
}

export function timer() {
	const start = process.hrtime();
	return () => toDuration(process.hrtime(start));
}

export function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

export function inRange(str, min, extra = 0.02) {
	console.log(`~> completed in ${str}ms`);

	const num = parseInt(str, 10);
	const max = min * (1 + extra);

	return num >= min && num < max;
}
