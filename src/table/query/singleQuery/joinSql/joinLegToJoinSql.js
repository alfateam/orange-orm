var joinLegToShallowJoinSql = require('./joinLegToShallowJoinSql');
var newJoinSql = _newJoinSql;

function toJoinSql(leg,alias,childAlias) {
	return joinLegToShallowJoinSql(leg,alias,childAlias).append(newJoinSql(leg.span,childAlias));
}

function _newJoinSql() {
	newJoinSql = require('../newJoinSql');
	return newJoinSql.apply(null,arguments);
}

module.exports = toJoinSql;