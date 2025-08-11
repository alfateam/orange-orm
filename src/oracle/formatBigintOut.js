const quote = require('./quote');

function formatBigintOut(column, alias) {
	const quotedCol = quote(column._dbName);
	if (alias)
		return `TO_CHAR(${alias}.${quotedCol})`;
	else
		return `TO_CHAR(${quotedCol})`;
}


module.exports = formatBigintOut;