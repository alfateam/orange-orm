const newShallowJoinSql = require('../../../query/singleQuery/joinSql/newShallowJoinSql');
const createAlias = require('../createAlias');

function newJoinSql(context, relations) {
	const length = relations.length;
	let leftAlias,
		rightAlias;
	let sql = '';

	function addSql(relation) {
		const rightColumns = relation.childTable._primaryColumns;
		const leftColumns = relation.columns;
		sql += ' INNER' + newShallowJoinSql(context, relation.childTable, leftColumns, rightColumns, leftAlias, rightAlias).sql();
	}

	relations.forEach(function(relation, i) {
		leftAlias = 'x' + (length - i);
		rightAlias = createAlias(relation.childTable, length - i - 1);
		addSql(relation);

	});

	return sql;
}

module.exports = newJoinSql;
