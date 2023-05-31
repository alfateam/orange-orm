let dateToISOString = require('../dateToISOString');
const isNode = (typeof window === 'undefined');

function stringify(value) {
	return JSON.stringify(value, replacer);
}

function replacer(key, value) {
	if (isNode && isNodeBuffer(value))
		return value.toString('base64');
	// @ts-ignore
	else if (value instanceof Date  && !isNaN(value))
		return dateToISOString(value);
	else
		return value;
}

function isNodeBuffer(object) {
	return Buffer.isBuffer(object);
}

module.exports = stringify;