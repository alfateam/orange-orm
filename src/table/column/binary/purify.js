function purify(value) {
	if(value == null)
		return null;
	if (!Buffer.isBuffer(value))
		throw new Error('\'' + value + '\'' + ' is not a buffer');
	return value;
}

module.exports = purify;