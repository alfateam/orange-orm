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

	for(let key in span.aggregates) {
		sql = sql.append(span.aggregates[key].join);
	}

	return sql;
}

module.exports = _new;