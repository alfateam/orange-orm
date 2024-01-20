function createAlias(table, depth) {
	if (depth === 0)
		return table._dbName;
	return 'x' + depth;
}
module.exports = createAlias;