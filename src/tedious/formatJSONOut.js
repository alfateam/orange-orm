function formatJSONOut(column, alias) {
	if (alias)
		return `JSON_QUERY(${alias}.[${column._dbName}])`;
	else
		return `JSON_QUERY([${column._dbName}])`;
}

module.exports = formatJSONOut;