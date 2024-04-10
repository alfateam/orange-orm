var joinLegToJoinSql = require('./joinSql/joinLegToJoinSql');
var oneLegToJoinSql = require('./joinSql/oneLegToJoinSql');

function _new(span,alias = '') {
	var sql = '';
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
	return sql;
}

module.exports = _new;