const quote = require('./quote');

function formatDateOut(column, alias) {
	if (alias)
		return `FORMAT(${alias}.${quote(column._dbName)}, 'yyyy-MM-ddTHH:mm:sszzz')`;
	// return `LEFT(CONVERT(varchar(33), ${alias}.${quote(column._dbName)}, 127), 25)`;
	else
		return `FORMAT(${quote(column._dbName)}, 'yyyy-MM-ddTHH:mm:sszzz')`;
		// return `LEFT(CONVERT(varchar(33), ${quote(column._dbName)}, 127), 25)`;


}

module.exports = formatDateOut;