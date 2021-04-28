function encodeBoolean(bool) {
	if (bool)
		return 1;
	return 0;
}

module.exports = encodeBoolean;