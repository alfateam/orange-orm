var newParameterized = require('../query/newParameterized');
var newJoinSql = require('./aggregate/joinSql');
var getSessionContext = require('../getSessionContext');

function columnAggregate(operator, column, _relations) {
	const context = getSessionContext();
	const prefix = 'y' + context.aggregateCount++ + '_';
	const alias = prefix + (_relations.length-1);

	return {
		expression: newParameterized(`${operator}(${alias}.${column._dbName})`),
		join: newJoinSql(_relations, prefix)
	};

	// LEFT JOIN (
	// 	SELECT line1.sale_id, SUM(line1.amount) AS total_amount
	// 	FROM line1
	// 	GROUP BY line1.sale_id
	// ) l1 ON s.sale_id = l1.sale_id


}

module.exports = columnAggregate;