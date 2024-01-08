function limitAndOffset(span) {
	if (span.offset)
		return ` limit ${limit()} offset ${span.offset}`;
	else if (span.limit || span.limit === 0)
		return ` limit ${span.limit}`;
	else
		return '';

	function limit() {
		if (span.limit || span.limit === 0)
			return span.limit;
		else
			return '-1';
	}

}

module.exports = limitAndOffset;