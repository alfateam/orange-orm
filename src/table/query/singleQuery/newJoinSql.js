const joinLegToJoinSql = require('./joinSql/joinLegToJoinSql');
const oneLegToJoinSql = require('./joinSql/oneLegToJoinSql');
const newParameterized = require('../newParameterized');

function newJoinSql(context,span,alias = '') {
	var sql = newParameterized('');
	var childAlias;

	var c = {};
	c.visitJoin = function(leg) {
		sql = joinLegToJoinSql(newJoinSql, context,leg,alias,childAlias).prepend(sql);
	};

	c.visitOne = function(leg) {
		sql = oneLegToJoinSql(newJoinSql, context,leg,alias,childAlias).prepend(sql);
	};

	c.visitMany = function() {};

	function onEachLeg(leg) {
		childAlias = alias + leg.name;
		leg.accept(c);
	}

	span.legs.forEach(onEachLeg);

	const set = new Set();
	for(let key in span.aggregates) {
		const agg = span.aggregates[key];
		for(let join of agg.joins) {
			if (!set.has(join)) {
				sql = sql.append(join);
				set.add(join);
			}
		}
	}

	return sql;
}

module.exports = newJoinSql;