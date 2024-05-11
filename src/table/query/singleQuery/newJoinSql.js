var joinLegToJoinSql = require('./joinSql/joinLegToJoinSql');
var oneLegToJoinSql = require('./joinSql/oneLegToJoinSql');
var newParameterized = require('../newParameterized');

function _new(span,alias = '') {
	var sql = newParameterized('');
	var childAlias;

	var c = {};
	c.visitJoin = function(leg) {
		sql = joinLegToJoinSql(leg,alias,childAlias).prepend(sql);
	};

	c.visitOne = function(leg) {
		sql = oneLegToJoinSql(leg,alias,childAlias).prepend(sql);
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

module.exports = _new;