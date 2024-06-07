var getSessionSingleton = require('../../getSessionSingleton');
const quote = require('../../quote');

//todo fix

function formatOut(column, alias) {
	var formatColumn = getSessionSingleton('formatDateOut');
	if (formatColumn)
		return formatColumn(column, alias);
	else
		return `${alias}.${quote(column._dbName)}`;
}

module.exports = formatOut;
