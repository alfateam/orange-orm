let emptyFilter = require('../../emptyFilter');
let newForeignKeyFilter = require('../relation/newForeignKeyFilter');
let negotiateExpandInverse = require('../negotiateExpandInverse');

function getRelatives(parent, relation) {
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
		return column.in(ids);
	}

	function createCompositeFilter() {
		let filters = queryContext.rows.map(function(row) {
			return newForeignKeyFilter(relation.joinRelation, row);
		});
		return emptyFilter.or.apply(emptyFilter, filters);
	}

	return relation.childTable.getMany(filter, strategy).then(onRows);

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse(parent, relation, rows);
		return rows;
	}

}

module.exports = getRelatives;