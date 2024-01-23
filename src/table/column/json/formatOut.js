var getSessionSingleton = require('../../getSessionSingleton');

function formatOut(column, alias) {
	var formatColumn = getSessionSingleton('formatJSONOut');
	if (formatColumn)
		return formatColumn(column, alias);
	else
		return `${alias}.${column._dbName}`;
}

module.exports = formatOut;
