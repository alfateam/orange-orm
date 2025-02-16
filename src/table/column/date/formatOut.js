var getSessionSingleton = require('../../getSessionSingleton');
const quote = require('../../quote');

function formatOut(context, column, alias) {
	var formatColumn = getSessionSingleton(context, 'formatDateOut');
	if (formatColumn)
		return formatColumn(column, alias);
	else
		return `${alias}.${quote(context, column._dbName)}`;
}

module.exports = formatOut;
