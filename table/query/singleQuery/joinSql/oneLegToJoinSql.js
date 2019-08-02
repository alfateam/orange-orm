var oneLegToShallowJoinSql = require('./oneLegToShallowJoinSql');
var newJoinSql = _newJoinSql;

function toJoinSql(leg,alias,childAlias) {
	return oneLegToShallowJoinSql(leg,alias,childAlias) +
			newJoinSql(leg.span,childAlias);
}

function _newJoinSql() {
	newJoinSql = require('../newJoinSql');
	return newJoinSql.apply(null,arguments);
}

module.exports = toJoinSql;