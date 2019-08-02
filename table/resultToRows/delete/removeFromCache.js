var nextRemoveFromCache = _nextRemoveFromCache;

function removeFromCache(row, strategy, table) {
	if (Array.isArray(row)) {
		removeManyRows();
		return;
	}
	if (row)
		removeSingleRow();

	function removeManyRows() {
		row.forEach( function(rowToRemove) {
			nextRemoveFromCache(rowToRemove, strategy, table);
		});
	}

	function removeSingleRow() {
		var relations = table._relations;
		for (var relationName in strategy) {
			var relation = relations[relationName];
			var rows = relation.getRowsSync(row);
			nextRemoveFromCache(rows, strategy[relationName], relation.childTable);
		}
		table._cache.tryRemove(row);
	}
}

function _nextRemoveFromCache(row, strategy, table) {
	nextRemoveFromCache = require('./removeFromCache');
	nextRemoveFromCache(row, strategy, table);
}

module.exports = removeFromCache;