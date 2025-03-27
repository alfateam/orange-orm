const getSessionSingleton = require('../getSessionSingleton');

function columnAggregate(context, operator, column, table, coalesce = true) {
	const quote = getSessionSingleton(context, 'quote');

	const tableAlias = quote(table._rootAlias || table._dbName);
	const columnName = quote(column._dbName);

	return {
		expression: (alias) => coalesce ? `COALESCE(${operator}(${tableAlias}.${columnName}), 0) as ${quote(alias)}` : `${operator}(${tableAlias}.${columnName}) as ${quote(alias)}`,
		joins: ['']
	};
}

module.exports = columnAggregate;