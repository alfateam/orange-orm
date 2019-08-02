function toIntKey(key) {
	if (isInteger())
		return key;
	if (isIntegerString())
		return trim(key);
	var intKey = '';
	for (var i = 0; i < key.length; ++i) {
		var value = key[i].toUpperCase();
		value = parseInt(value, 16);
		if (!isNaN(value))
			intKey += value;
	}

	return trim(intKey);

	function isIntegerString() {
		var pattern = /^-?\d+\.?\d*$/;
		var reg = new RegExp(pattern);
		return (typeof key === 'string' && reg.test(key));
	}

	function isInteger() {
		return (typeof key === 'number') && (Math.floor(key) === key);
	}

	function trim(value) {
		var maxBigInt = '9223372036854775807';
		value = value.substring(0, 19);
		if (value > maxBigInt)
			return value.substring(0,18);
		return value;
	}
}

module.exports = toIntKey;
