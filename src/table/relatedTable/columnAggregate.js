const getSessionSingleton = require('../getSessionSingleton');
var newJoinArray = require('./joinSqlArray');

function columnAggregate(operator, column, relations, coalesce = true) {
	const quote = getSessionSingleton('quote');

	let tableAlias = relations.reduce((prev,relation) => {
		return prev + relation.toLeg().name;
	}, 'z');
	tableAlias = quote(tableAlias);

	return {
		expression: (alias) => coalesce ? `COALESCE(${operator}(${tableAlias}.${column._dbName}), 0) as ${quote(alias)}` : `${operator}(${tableAlias}.${column._dbName}) as ${alias}`,

		joins: newJoinArray(relations)
	};
}

module.exports = columnAggregate;