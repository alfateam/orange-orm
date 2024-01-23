function formatDateOut(column, alias) {
	return `CONVERT(VARCHAR, ${alias}.${column._dbName}, 120)`;
}

module.exports = formatDateOut;