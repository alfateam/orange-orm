var newJoin = require('./joinSql');
var getSessionContext = require('../getSessionContext');
var newJoinCore = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');
const getSessionSingleton = require('../getSessionSingleton');

function childColumn(column, relations) {
	const quote = getSessionSingleton('quote');
	const context = getSessionContext();
	const outerAlias = 'y' + context.aggregateCount++;
	const outerAliasQuoted = quote(outerAlias);
	const alias = 'x' + relations.length;
	const foreignKeys = getForeignKeys(relations[0]);
	const select = ` LEFT JOIN (SELECT ${foreignKeys},${alias}.${column._dbName} as prop`;
	const innerJoin = relations.length > 1 ? newJoin(relations).sql() : '';
	const onClause = createOnClause(relations[0], outerAlias);
	const from = ` FROM ${quote(relations.at(-1).childTable._dbName)} ${alias} ${innerJoin}) ${outerAliasQuoted} ON (${onClause})`;
	const join = select  + from ;

	return {
		expression: (alias) => `${outerAliasQuoted}.prop ${quote(alias)}`,
		joins: [join],
		column,
		groupBy:  `${outerAliasQuoted}.prop`,
	};
}

function createOnClause(relation, rightAlias) {
	var c = {};
	var sql = '';
	let leftAlias = relation.parentTable._rootAlias || relation.parentTable._dbName;

	c.visitJoin = function(relation) {
		sql = newJoinCore(relation.childTable,relation.columns,relation.childTable._primaryColumns,leftAlias,rightAlias).sql();
	};

	c.visitOne = function(relation) {
		innerJoin(relation);
	};

	c.visitMany = c.visitOne;

	function innerJoin(relation) {
		var joinRelation = relation.joinRelation;
		var childTable = relation.childTable;
		var parentTable = relation.parentTable;
		var columns = joinRelation.columns;

		sql = newJoinCore(childTable,parentTable._primaryColumns,columns,leftAlias, rightAlias).sql();
	}
	relation.accept(c);
	return sql;
}

function getForeignKeys(relation) {
	let columns;
	let alias = 'x1';
	if (relation.joinRelation)
		columns = relation.joinRelation.columns;
	else
		columns = relation.childTable._primaryColumns;
	return columns.map(x => `${alias}.${x._dbName}`).join(',');
}

module.exports = childColumn;