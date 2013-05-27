var oneLegToShallowJoinSql = require('./oneLegToShallowJoinSql');
var newJoinSql = require('../newJoinSql');

function toJoinSql(leg,alias,childAlias) {
	return oneLegToShallowJoinSql(leg,alias,childAlias) +
			newJoinSql(leg,childAlias);
}

module.exports = toJoinSql;