function fuzzyPromise(value) {
	if (value !== undefined && value !== null)
		Object.defineProperty(value, 'then', {
			value: then,
			writable: true,
			enumerable: false,
			configurable: true
		});

	return value;

	function then(fn) {
		delete value.then;
		fn(value);
	}
}

module.exports = fuzzyPromise;