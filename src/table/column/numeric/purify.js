function purify(value) {
	if(value == null)
		return null;
	const parsedFloat = Number.parseFloat(value);
	if (!isNaN(parsedFloat))
		return parsedFloat;
	if (typeof(value) !== 'number')
		throw new Error('\'' + value + '\'' + ' is not a number');
	return value;
}

module.exports = purify;