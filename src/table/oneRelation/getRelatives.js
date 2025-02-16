let emptyFilter = require('../../emptyFilter');
let newForeignKeyFilter = require('../relation/newForeignKeyFilter');
let negotiateExpandInverse = require('../negotiateExpandInverse');

function getRelatives(context, parent, relation) {
	let queryContext = parent.queryContext;
	let strategy = queryContext && queryContext.strategy[relation.joinRelation.rightAlias];


	let filter;
	let parentTable = relation.joinRelation.childTable;

	if (parentTable._primaryColumns.length === 1)
		filter = createInFilter();
	else
		filter = createCompositeFilter();


	function createInFilter() {
		let parentAlias = parentTable._primaryColumns[0].alias;
		let ids = queryContext.rows.map(function(row) {
			return row[parentAlias];
		});
		let column = relation.joinRelation.columns[0];
		return column.in(context, ids);
	}

	function createCompositeFilter() {
		let filters = queryContext.rows.map(function(row) {
			return newForeignKeyFilter(context, relation.joinRelation, row);
		});
		return emptyFilter.or.apply(emptyFilter, [context, ...filters]);
	}

	return relation.childTable.getMany(context, filter, strategy).then(onRows);

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse(parent, relation, rows);
		return rows;
	}

}

module.exports = getRelatives;