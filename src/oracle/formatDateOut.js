const quote = require('./quote');

function formatDateColumn(column, alias) {
	return `TO_CHAR(${alias}.${quote(column._dbName)}, 'YYYY-MM-DD"T"HH24:MI:SS.FF3')`;
}

module.exports = formatDateColumn;