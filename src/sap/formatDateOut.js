const quote = require('./quote');

function formatDateOut(column, alias) {
	return `CONVERT(VARCHAR, ${alias}.${quote(column._dbName)}, 23)`;
}

module.exports = formatDateOut;