var getSessionContext = require('../getSessionContext');

function extractOffset(context, span) {
	let {limitAndOffset} = getSessionContext(context);
	if (limitAndOffset)
		return limitAndOffset(span);
	else
		return '';
}

module.exports = extractOffset;