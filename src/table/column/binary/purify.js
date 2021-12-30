function purify(value) {
	if(value == null)
		return null;
	if (Buffer.isBuffer(value))
		return value;
	else if (typeof value === 'string')
		return Buffer.from(value, 'base64');
	else
		throw new Error('\'' + value + '\'' + ' is not a buffer');
}

module.exports = purify;