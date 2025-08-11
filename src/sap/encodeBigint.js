function encodeBoolean(value) {
	return {
		type: 'bigint',
		value
	};
}

module.exports = encodeBoolean;