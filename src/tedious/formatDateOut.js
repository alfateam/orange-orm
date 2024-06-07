const quote = require('../table/quote');

function formatDateOut(column, alias) {
	return `CONVERT(VARCHAR, ${alias}.${quote(column._dbName)}, 121)`;
}

module.exports = formatDateOut;