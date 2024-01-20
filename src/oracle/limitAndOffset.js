function limitAndOffset(span) {
	if (span.offset)
		return ` OFFSET ${span.offset} ROWS FETCH NEXT ${limit()} ROWS ONLY`;
	else if (span.limit || span.limit === 0)
		return ` FETCH FIRST ${span.limit} ROWS ONLY`;
	else
		return '';

	function limit() {
		if (span.limit || span.limit === 0)
			return span.limit;
		else
			return '';
	}

}

module.exports = limitAndOffset;