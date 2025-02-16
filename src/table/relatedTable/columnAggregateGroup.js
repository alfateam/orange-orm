var newJoin = require('./joinSql');
var getSessionContext = require('../getSessionContext');
var newJoinCore = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');
const getSessionSingleton = require('../getSessionSingleton');

function columnAggregate(context, operator, column, relations, coalesce = true) {
	const quote = getSessionSingleton(context, 'quote');
	const rdb = getSessionContext(context);
	const outerAlias = 'y' + rdb.aggregateCount++;
	const outerAliasQuoted = quote(outerAlias);
	const alias = quote('x' + relations.length);
	const foreignKeys = getForeignKeys(relations[0]);
	const select = ` LEFT JOIN (SELECT ${foreignKeys},${operator}(${alias}.${quote(column._dbName)}) as amount`;
	const innerJoin = relations.length > 1 ? newJoin(context, relations).sql() : '';
	const onClause = createOnClause(context, relations[0], outerAlias);
	const from = ` FROM ${quote(relations.at(-1).childTable._dbName)} ${alias} ${innerJoin} GROUP BY ${foreignKeys}) ${outerAliasQuoted} ON (${onClause})`;
	const join = select + from;

	return {
		expression: (alias) => coalesce ? `COALESCE(${outerAliasQuoted}.amount, 0) as ${quote(alias)}` : `${outerAliasQuoted}.amount as ${alias}`,
		joins: [join]
	};

	function getForeignKeys(relation) {
		let columns;
		let alias = quote('x1');
		if (relation.joinRelation)
			columns = relation.joinRelation.columns;
		else
			columns = relation.childTable._primaryColumns;
		return columns.map(x => `${alias}.${quote(x._dbName)}`).join(',');
	}
}

function createOnClause(context, relation, rightAlias) {
	var c = {};
	var sql = '';
	let leftAlias = relation.parentTable._rootAlias || relation.parentTable._dbName;

	c.visitJoin = function(relation) {
		sql = newJoinCore(context, relation.childTable, relation.columns, relation.childTable._primaryColumns, leftAlias, rightAlias).sql();
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

		sql = newJoinCore(context, childTable, parentTable._primaryColumns, columns, leftAlias, rightAlias).sql();
	}

	relation.accept(c);
	return sql;
}



module.exports = columnAggregate;