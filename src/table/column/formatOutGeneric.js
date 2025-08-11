var getSessionSingleton = require('../getSessionSingleton');
const quote = require('../quote');

function formatOutGeneric(context, column, fnName, alias) {
	var formatColumn = getSessionSingleton(context, fnName);
	if (formatColumn)
		return formatColumn(column, alias);
	else if (alias)
		return `${alias}.${quote(context, column._dbName)}`;
	else
		return `${quote(context, column._dbName)}`;
}

module.exports = formatOutGeneric;
