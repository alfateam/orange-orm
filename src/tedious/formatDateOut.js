const quote = require('./quote');

function formatDateOut(column, alias) {
	if (alias)
		return `CONVERT(VARCHAR, ${alias}.${quote(column._dbName)}, 121)`;
	else
		return `CONVERT(VARCHAR, ${quote(column._dbName)}, 121)`;
}

module.exports = formatDateOut;