var getSessionContext = require('../getSessionContext');
var newJoinCore = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');
const getSessionSingleton = require('../getSessionSingleton');

function columnAggregate(context, operator, column, table, coalesce = true) {
	const quote = getSessionSingleton(context, 'quote');
	const rdb = getSessionContext(context);
	const outerAlias = 'y' + rdb.aggregateCount++;
	const outerAliasQuoted = quote(outerAlias);
	const alias = quote('x');
	const foreignKeys = getForeignKeys(table);
	const select = ` LEFT JOIN (SELECT ${foreignKeys},${operator}(${alias}.${quote(column._dbName)}) as amount`;
	const onClause = createOnClause(context, table, outerAlias);
	const from = ` FROM ${quote(table._dbName)} ${alias} GROUP BY ${foreignKeys}) ${outerAliasQuoted} ON (${onClause})`;
	const join = select + from;

	return {
		expression: (alias) => coalesce ? `COALESCE(${outerAliasQuoted}.amount, 0) as ${quote(alias)}` : `${outerAliasQuoted}.amount as ${alias}`,
		joins: [join]
	};

	function getForeignKeys(table) {
		return table._primaryColumns.map(x => `${alias}.${quote(x._dbName)}`).join(',');
	}
}

function createOnClause(context, table, rightAlias) {
	let leftAlias = table._rootAlias || table._dbName;
	const columns = table._primaryColumns;
	return newJoinCore(context, table, columns, columns, leftAlias, rightAlias).sql();
}



module.exports = columnAggregate;