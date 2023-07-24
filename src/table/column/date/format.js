var getSessionSingleton = require('../../getSessionSingleton');

function format(column, alias) {
	var formatColumn = getSessionSingleton('formatDateColumn');
	if (formatColumn)
		return formatColumn(column, alias);
	else
		return `${alias}.${column._dbName}`;
}

module.exports = format;
