function formatJSONOut(column, alias) {
	return `JSON_QUERY(${alias}.${column._dbName})`;
}

module.exports = formatJSONOut;