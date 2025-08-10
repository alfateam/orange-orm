const quote = require('./quote');

function formatBigintOut(column, alias) {
	const quotedCol = quote(column._dbName);
	if (alias)
		return `CONVERT(VARCHAR(20), ${alias}.${quotedCol})`;
	else
		return `CONVERT(NVARCHAR(20), ${quotedCol})`;
}

module.exports = formatBigintOut;