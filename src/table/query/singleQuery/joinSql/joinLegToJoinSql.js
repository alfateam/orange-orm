var joinLegToShallowJoinSql = require('./joinLegToShallowJoinSql');

function toJoinSql(newJoinSql, context,leg,alias,childAlias) {
	return joinLegToShallowJoinSql(context,leg,alias,childAlias).append(newJoinSql(context,leg.span,childAlias));
}


module.exports = toJoinSql;