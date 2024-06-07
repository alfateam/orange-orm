const getSessionSingleton = require('../getSessionSingleton');
var newJoinArray = require('./joinSqlArray');

function columnAggregate(operator, column, relations, coalesce = true) {
	const quote = getSessionSingleton('quote');

	let tableAlias = relations.reduce((prev,relation) => {
		return prev + relation.toLeg().name;
	}, 'z');
	tableAlias = quote(tableAlias);
	const columnName = quote(column._dbName);

	return {
		expression: (alias) => coalesce ? `COALESCE(${operator}(${tableAlias}.${columnName}), 0) as ${quote(alias)}` : `${operator}(${tableAlias}.${columnName}) as ${alias}`,

		joins: newJoinArray(relations)
	};
}

module.exports = columnAggregate;