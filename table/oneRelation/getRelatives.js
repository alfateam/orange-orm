var empty = require('../resultToPromise')(false);
var emptyFilter = require('../../emptyFilter');
var newForeignKeyFilter = require('../relation/newForeignKeyFilter');
var negotiateExpandInverse = require('../negotiateExpandInverse');

function getRelatives(parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;

	var filter;
	var parentTable = relation.joinRelation.childTable;

	if (parentTable._primaryColumns.length === 1)
		filter = createInFilter();
	else
		filter = createCompositeFilter();


	function createInFilter() {
        var parentAlias = parentTable._primaryColumns[0].alias;
        var ids = queryContext.rows.map(function(row) {
			return row[parentAlias];
		});
        var column = relation.joinRelation.columns[0];
        return column.in(ids);
	}

	function createCompositeFilter() {
		var filters = queryContext.rows.map(function(row) {
			return newForeignKeyFilter(relation.joinRelation, row);
		});
		return emptyFilter.or.apply(emptyFilter, filters)
	}

    return relation.childTable.getMany(filter).then(onRows);

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse(parent, relation, rows);
		return rows;
	}

}

module.exports = getRelatives;