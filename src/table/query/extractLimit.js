var getSessionContext = require('../getSessionContext');

function extractLimit(context, span) {
	let limit = getSessionContext(context).limit;
	if (limit)
		return limit(span);
	else
		return '';
}

module.exports = extractLimit;