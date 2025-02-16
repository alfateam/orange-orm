var newJoin = require('./joinSql');
var getSessionContext = require('../getSessionContext');
var newJoinCore = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');
const getSessionSingleton = require('../getSessionSingleton');
const _quote = require('../quote');


function childColumn(context, column, relations) {
	const quote = getSessionSingleton(context, 'quote');
	const rdb = getSessionContext(context);
	const outerAlias = 'y' + rdb.aggregateCount++;
	const outerAliasQuoted = quote(outerAlias);
	const alias = 'x' + relations.length;
	const foreignKeys = getForeignKeys(context, relations[0]);
	const select = ` LEFT JOIN (SELECT ${foreignKeys},${alias}.${quote(column._dbName)} as prop`;
	const innerJoin = relations.length > 1 ? newJoin(context, relations).sql() : '';
	const onClause = createOnClause(context, relations[0], outerAlias);
	const from = ` FROM ${quote(relations.at(-1).childTable._dbName)} ${alias} ${innerJoin}) ${outerAliasQuoted} ON (${onClause})`;
	const join = select  + from ;

	return {
		expression: (alias) => `${outerAliasQuoted}.prop ${quote(alias)}`,
		joins: [join],
		column,
		groupBy:  `${outerAliasQuoted}.prop`,
	};
}

function createOnClause(context, relation, rightAlias) {
	var c = {};
	var sql = '';
	let leftAlias = relation.parentTable._rootAlias || relation.parentTable._dbName;

	c.visitJoin = function(relation) {
		sql = newJoinCore(context, relation.childTable,relation.columns,relation.childTable._primaryColumns,leftAlias,rightAlias).sql();
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

		sql = newJoinCore(context, childTable,parentTable._primaryColumns,columns,leftAlias, rightAlias).sql();
	}
	relation.accept(c);
	return sql;
}

function getForeignKeys(context, relation) {
	let columns;
	let alias = 'x1';
	if (relation.joinRelation)
		columns = relation.joinRelation.columns;
	else
		columns = relation.childTable._primaryColumns;
	return columns.map(x => `${alias}.${_quote(context, x._dbName)}`).join(',');
}

module.exports = childColumn;