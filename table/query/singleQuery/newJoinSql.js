var joinLegToJoinSql = require('./joinSql/joinLegToJoinSql');
var oneLegToJoinSql = require('./joinSql/oneLegToJoinSql');

function _new(span,alias) {
	var sql = '';
	var legNo = 0;
	var childAlias;

	var c = {};	
	c.visitJoinLeg = function(leg) {
		sql = sql + joinLegToJoinSql(leg,alias,childAlias);
	};

	c.visitOneLeg = function(leg) {
		sql = sql + oneLegToJoinSql(leg,alias,childAlias);
	};

	c.visitManyLeg = function(leg) {};

	function onEachLeg(leg) {
		childAlias = alias + '_' + legNo;
		leg.accept(c);
		legNo++;
	}

	span.legs.forEach(onEachLeg);
	return sql;
}

module.exports = _new;