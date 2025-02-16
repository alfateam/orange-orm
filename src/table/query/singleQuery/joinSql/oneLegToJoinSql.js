var oneLegToShallowJoinSql = require('./oneLegToShallowJoinSql');

function toJoinSql(newJoinSql, context,leg,alias,childAlias) {
	return oneLegToShallowJoinSql(context,leg,alias,childAlias).append(newJoinSql(context,leg.span,childAlias));
}

module.exports = toJoinSql;