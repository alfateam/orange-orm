function formatDateOut(column, alias) {
	return `CONVERT(VARCHAR, ${alias}.${column._dbName}, 121)`;
}

module.exports = formatDateOut;