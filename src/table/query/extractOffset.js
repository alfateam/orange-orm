var getSessionContext = require('../getSessionContext');
var validatePagination = require('./validatePagination');

function extractOffset(context, span) {
	validatePagination.offset(span);
	let {limitAndOffset} = getSessionContext(context);
	if (limitAndOffset)
		return limitAndOffset(span);
	else
		return '';
}

module.exports = extractOffset;
