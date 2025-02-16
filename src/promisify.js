function promisify(original) {
	if (typeof original !== 'function') {
		throw new TypeError('The "original" argument must be of type Function');
	}

	return function(...args) {
		return new Promise((resolve, reject) => {
			// Add the callback that Node-style APIs expect
			function callback(err, ...values) {
				if (err) {
					return reject(err);
				}
				// If there's exactly one success value, return it;
				// otherwise, return all values as an array.
				return resolve(values.length > 1 ? values : values[0]);
			}

			// Call the original function, appending our callback
			original.call(this, ...args, callback);
		});
	};
}

module.exports = promisify;