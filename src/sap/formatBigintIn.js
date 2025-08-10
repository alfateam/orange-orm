function formatBigintIn(value) {
	return `CONVERT(BIGINT, ${value})`;
}

module.exports = formatBigintIn;