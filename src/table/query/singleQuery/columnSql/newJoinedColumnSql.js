var joinLegToColumnSql = require('./joinLegToColumnSql');

module.exports = function(span,alias,ignoreNull) {
	var c = {};
	var sql = '';

	c.visitJoin = function(leg) {
		var joinSql = joinLegToColumnSql(leg,alias  + leg.name, ignoreNull);
		sql = sql + joinSql;
	};

	c.visitOne = function(leg) {
		c.visitJoin(leg);
	};

	c.visitMany = function() {
	};

	span.legs.forEach(onEach);


	function onEach(leg) {
		leg.accept(c);
	}

	return sql;
};