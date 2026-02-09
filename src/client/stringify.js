let dateToISOString = require('../dateToISOString');

function stringify(value) {
	return JSON.stringify(value, replacer);
}

function replacer(key, value) {
	// @ts-ignore
	if (typeof value === 'bigint')
		return value.toString();
	else if (value instanceof Date  && !isNaN(value))
		return dateToISOString(value);
	else
		return value;
}

module.exports = stringify;
