var getSessionSingleton = require('../../getSessionSingleton');

function format(column) {
	var formatColumn = getSessionSingleton('formatDateColumn');
	if (formatColumn)
		return formatColumn(column);
	else
		return column._dbName;
}

module.exports = format;
