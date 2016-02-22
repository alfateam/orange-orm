function negotiateLimit(limit) {
	if(!limit)
		return '';

	if(limit.charAt(0) !== ' ')
		return ' ' + limit;
	return limit;
}

module.exports = negotiateLimit;