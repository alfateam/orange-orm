function purify(value) {		
	if (value === null || typeof (value) == 'undefined')
		return null;
	return Boolean(value);
}

module.exports = purify;