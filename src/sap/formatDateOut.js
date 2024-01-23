function formatDateOut(column, alias) {
	return `CONVERT(VARCHAR, ${alias}.${column._dbName}, 23)`;
}

module.exports = formatDateOut;