function limitAndOffset(span) {
	if (span.offset)
		return ` ROWS ${limit()} OFFSET ${span.offset}`;
	else
		return '';

	function limit() {
		if (span.limit || span.limit === 0)
			return ` LIMIT ${span.limit}`;
		else
			return '';
	}

}

module.exports = limitAndOffset;