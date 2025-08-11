const quote = require('./quote');

function formatBigintOut(column, alias) {
	const quotedCol = quote(column._dbName);
	if (alias)
		return `CAST(${alias}.${quotedCol} AS CHAR)`;
	else
		return `CAST(${quotedCol} AS CHAR)`;
}

module.exports = formatBigintOut;