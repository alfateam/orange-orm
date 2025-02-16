var newShallowColumnSql = require('./newShallowColumnSql');

function joinLegToColumnSql(context, leg, alias, ignoreNull) {
	var span = leg.span;
	var shallowColumnSql = newShallowColumnSql(context, span.table, alias, span, ignoreNull);
	var joinedColumnSql = newJoinedColumnSql(context, span, alias, ignoreNull);
	return ',' + shallowColumnSql + joinedColumnSql;
}

function newJoinedColumnSql(context, span, alias, ignoreNull) {
	var c = {};
	var sql = '';

	c.visitJoin = function(leg) {
		var joinSql = joinLegToColumnSql(context, leg, alias + leg.name, ignoreNull);
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
}


module.exports = { joinLegToColumnSql, newJoinedColumnSql };