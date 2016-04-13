function purify(value) {
	if(value == null)
		return null;
	return JSON.stringify(value);
}

module.exports = purify;