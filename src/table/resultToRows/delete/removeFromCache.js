function removeFromCache(context, row, strategy, table) {
	if (Array.isArray(row)) {
		removeManyRows();
		return;
	}
	if (row)
		removeSingleRow();

	function removeManyRows() {
		row.forEach( function(rowToRemove) {
			removeFromCache(context, rowToRemove, strategy, table);
		});
	}

	function removeSingleRow() {
		var relations = table._relations;
		for (var relationName in strategy) {
			var relation = relations[relationName];
			var rows = relation.getRowsSync(row);
			removeFromCache(context, rows, strategy[relationName], relation.childTable);
		}
		table._cache.tryRemove(context, row);
	}
}

module.exports = removeFromCache;