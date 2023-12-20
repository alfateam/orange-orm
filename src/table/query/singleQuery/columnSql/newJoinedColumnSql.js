var joinLegToColumnSql = require('./joinLegToColumnSql');

module.exports = function(span,alias,ignoreNull) {
	var index = 0;
	var c = {};
	var sql = '';

	c.visitJoin = function(leg) {
		var joinSql = joinLegToColumnSql(leg,alias + '_' + index, ignoreNull);
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
		index++;
	}

	return sql;
};