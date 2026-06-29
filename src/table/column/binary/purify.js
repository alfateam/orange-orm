function purify(value) {
	if(value == null)
		return null;
	if (isBuffer(value))
		return value.toString('base64');
	else if (typeof value === 'string')
		return value;
	else
		throw new Error('\'' + value + '\'' + ' is not a base64');
}

function isBuffer(value) {
	return typeof Buffer !== 'undefined'
		&& typeof Buffer.isBuffer === 'function'
		&& Buffer.isBuffer(value);
}

module.exports = purify;
