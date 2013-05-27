var joinLegToColumnSql = require('./joinLegToColumnSql');

module.exports = function(span,alias) {
	var index = 0;
	var c = {};
	var sql = '';

	c.visitJoinLeg = function(leg) {
		var joinSql = joinLegToColumnSql(leg,alias + '_' + index);
		sql = sql + joinSql;
	};

	c.visitOneLeg = function (leg) {
		c.visitJoinLeg(leg);
	};

	c.visitManyLeg = function(leg) {
	};


	span.legs.forEach(onEach);


	function onEach(leg) {
		leg.accept(c);
		index++;
	}

	return sql;
};