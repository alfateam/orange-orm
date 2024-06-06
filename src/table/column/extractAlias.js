function extract(table, optionalAlias) {

	if (optionalAlias)
		return optionalAlias;
	// return table._rootAlias || quote(table._dbName);
	return table._rootAlias || table._dbName;
}

module.exports = extract;