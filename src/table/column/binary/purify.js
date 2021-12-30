function purify(value) {
	if(value == null)
		return null;
	if (Buffer.isBuffer(value))
		return value.toString('base64');
	else if (typeof value === 'string')
		return value;
	else
		throw new Error('\'' + value + '\'' + ' is not a base64');
}

module.exports = purify;