var getSessionContext = require('../getSessionContext');

function extractOffset(span) {
	let {limitAndOffset} = getSessionContext();
	if (limitAndOffset)
		return limitAndOffset(span);
	else
		return '';
}

module.exports = extractOffset;