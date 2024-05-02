var newParameterized = require('../query/newParameterized');

function columnAggregate(operator, column, table) {
	const alias = (table._rootAlias || table._dbName);

	return {
		expression: newParameterized(`${operator}(${alias}.${column._dbName})`),
		join: newParameterized('')
	};

}

module.exports = columnAggregate;