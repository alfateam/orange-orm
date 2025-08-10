const quote = require('./quote');

function formatBigintOut(column, alias) {
	const quotedCol = quote(column._dbName);
	if (alias)
		return `CAST(${alias}.${quotedCol} AS TEXT)`;
	else
		return `CAST(${quotedCol} AS TEXT)`;
}

module.exports = formatBigintOut;