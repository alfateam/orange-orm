var getSessionContext = require('../getSessionContext');

function extractLimit(span) {
	let limit = getSessionContext().limit;
	if (limit)
		return limit(span);
	else
		return '';
}

module.exports = extractLimit;