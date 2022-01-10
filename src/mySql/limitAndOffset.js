function limitAndOffset(span) {
	if (span.offset)
		return ` limit ${span.offset}${limit()}`;
	else if (span.limit || span.limit === 0)
		return ` limit ${span.limit}`;
	else
		return '';

	function limit() {
		if (span.limit || span.limit === 0)
			return `, ${span.limit}`;
		else
			return '';
	}

}

module.exports = limitAndOffset;