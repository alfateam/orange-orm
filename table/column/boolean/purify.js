function purify(value) {		
	if (value === null || typeof (value) == 'undefined')
		return null;
	if (value)
		return true;
	return false;
}

module.exports = purify;