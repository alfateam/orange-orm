function limitAndOffset(span) {
	if (span.offset)
		return ` OFFSET ${span.offset} ROWS${limit()}`;
	else
		return '';

	function limit() {
		if (span.limit || span.limit === 0)
			return ` FETCH NEXT ${span.limit} ROW ONLY`;
		else
			return '';
	}

}

module.exports = limitAndOffset;