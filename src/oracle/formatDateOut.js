const quote = require('./quote');

function formatDateColumn(column, alias) {
	if (alias)
		return `TO_CHAR(${alias}.${quote(column._dbName)}, 'YYYY-MM-DD"T"HH24:MI:SS.FF3')`;
	else
		return `TO_CHAR(${quote(column._dbName)}, 'YYYY-MM-DD"T"HH24:MI:SS.FF3')`;
}

module.exports = formatDateColumn;