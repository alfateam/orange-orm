let dateToISOString = require('../dateToISOString');
let rfdc = require('rfdc');
const isNode = (typeof window === 'undefined');
const clone =  rfdc({proto: false, circles: false});

function stringify(value) {
	return clone(value);
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