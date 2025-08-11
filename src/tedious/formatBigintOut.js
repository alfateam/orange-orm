const quote = require('./quote');

function formatBigintOut(column, alias) {
	const quotedCol = quote(column._dbName);
	if (alias)
		return `CAST(${alias}.${quotedCol} AS NVARCHAR(20))`;
	else
		return `CAST(${quotedCol} AS NVARCHAR(20))`;
}

module.exports = formatBigintOut;