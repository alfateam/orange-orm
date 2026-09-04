var getSessionContext = require('../getSessionContext');
var validatePagination = require('./validatePagination');

function extractLimit(context, span) {
	validatePagination.limit(span);
	let limit = getSessionContext(context).limit;
	if (limit)
		return limit(span);
	else
		return '';
}

module.exports = extractLimit;
