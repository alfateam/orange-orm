function extractLimit(span) {
	if (span.limit) {
		return ' limit ' + span.limit;
	}
	return '';
}

module.exports = extractLimit;