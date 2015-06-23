function extract(table, optionalAlias) {
	if (optionalAlias)
		return optionalAlias;
	return table._dbName;
}

module.exports = extract;