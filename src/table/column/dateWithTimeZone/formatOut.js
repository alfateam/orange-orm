var getSessionSingleton = require('../../getSessionSingleton');
const quote = require('../../quote');

function formatOut(context, column, alias) {
	var formatColumn = getSessionSingleton(context, 'formatDateTzOut') ||  getSessionSingleton(context, 'formatDateOut');
	if (formatColumn)
		return formatColumn(column, alias);
	else if (alias)
		return `${alias}.${quote(context, column._dbName)}`;
	else
		return `${quote(context, column._dbName)}`;
}

module.exports = formatOut;
