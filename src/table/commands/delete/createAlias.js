function createAlias(table, depth) {
	if (depth === 0)
		return table._dbName;
	return '_' + depth;
}
module.exports = createAlias;