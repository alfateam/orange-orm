const quote = require('../table/quote');

function formatDateOut(column, alias) {
	return `${alias}.${quote(column._dbName)}::text`;
}

module.exports = formatDateOut;