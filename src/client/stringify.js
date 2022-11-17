let dateToIsoString = require('../dateToIsoString');


function stringify(value) {
	return JSON.stringify(value, replacer);
}

function replacer(value) {
	if (Buffer.isBuffer(value))
		return value.toString('base64');
	// @ts-ignore
	else if (value instanceof Date  && !isNaN(value))
		return dateToIsoString(value);
	else
		return value;
}

module.exports = stringify;