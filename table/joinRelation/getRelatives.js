var newPrimaryKeyFilter = require('../newPrimaryKeyFilter');
var emptyFilter = require('../../emptyFilter');
var negotiateExpandInverse = require('../negotiateExpandInverse');

function getRelatives(parent, relation) {
	var queryContext = parent.queryContext;
	var filter = emptyFilter;
	if (relation.columns.length === 1)
		createInFilter();
	else
		createCompositeFilter();

	function createInFilter() {
		var ids = [];
		var row;
		var id;
		var alias = relation.columns[0].alias;
		for (var i = 0; i < queryContext.rows.length; i++) {
			row = queryContext.rows[i];
			id = row[alias];
			if (!isNullOrUndefined(id))
				ids.push(id);
		}

		if (ids.length > 0)
			filter = relation.childTable._primaryColumns[0].in(ids);
	}

	function createCompositeFilter() {
		var keyFilter;
		for (var i = 0; i < queryContext.rows.length; i++) {
			keyFilter = rowToPrimaryKeyFilter(queryContext.rows[i], relation);
			if (keyFilter)
				filter = filter.or(keyFilter);
		}
	}

	return relation.childTable.getMany(filter, getStrategy()).then(onRows);

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse(parent, relation, rows);
		return rows;
	}

	function getStrategy() {
		if (!queryContext.strategy)
			return;
		return queryContext.strategy[relation.leftAlias];
	}

}

function rowToPrimaryKeyFilter(row, relation) {
	var key = relation.columns.map( function(column) {
		return row[column.alias];
	});
	if (key.some(isNullOrUndefined)) {
		return;
	}
	var args = [relation.childTable].concat(key);
	return newPrimaryKeyFilter.apply(null, args);
}

function isNullOrUndefined(item) {
	return item === null || item === undefined;
}

module.exports = getRelatives;