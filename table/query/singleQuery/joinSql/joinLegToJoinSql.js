var joinLegToShallowJoinSql = require('./joinLegToShallowJoinSql');
var newJoinSql = require('../newJoinSql');

function toJoinSql(leg,alias,childAlias) {
	return joinLegToShallowJoinSql(leg,alias,childAlias) +
			newJoinSql(leg,childAlias);
}

module.exports = toJoinSql;