var newJoinArray = require('./joinSqlArray');

function columnAggregate(operator, column, relations, coalesce = true) {

	const tableAlias = relations.reduce((prev,relation) => {
		return prev + relation.toLeg().name;
	}, 'z');

	return {
		expression: (alias) => coalesce ? `COALESCE(${operator}(${tableAlias}.${column._dbName}), 0) as ${alias}` : `${operator}(${tableAlias}.${column._dbName}) as ${alias}`,

		joins: newJoinArray(relations)
	};
}

module.exports = columnAggregate;