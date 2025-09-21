const quote = require('./quote');

function formatDateOut(column, alias) {
	if (alias)
		return `CONVERT(VARCHAR, ${alias}.${quote(column._dbName)}, 126)`;
	else
		return `CONVERT(VARCHAR, ${quote(column._dbName)}, 126)`;
}

module.exports = formatDateOut;