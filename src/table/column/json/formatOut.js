var getSessionSingleton = require('../../getSessionSingleton');
const quote = require('../../quote');

function formatOut(column, alias) {
	var formatColumn = getSessionSingleton('formatJSONOut');
	if (formatColumn)
		return formatColumn(column, alias);
	else
		return `${alias}.${quote(column._dbName)}`;
}

module.exports = formatOut;
