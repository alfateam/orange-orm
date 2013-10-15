var newJoinRelation = require('./newJoinRelation');
var newGetRelatedTable = require('./newGetRelatedTable');

function newJoin(parentTable,childTable) {
	var c = {};
	var columnNames = [];
	
	c.by = function() {
		for (var i = 0; i < arguments.length; i++) {
			columnNames.push(arguments[i]);
		};
		return c;
	}

	c.as = function(alias) {
		var relation = newJoinRelation(parentTable,childTable,columnNames);
		parentTable[alias] = newGetRelatedTable(relation);
		return relation;
	}
	return c;
}

module.exports = newJoin;
/* todo remove
var orderLine_order_relation = orderLine.join('order',order).by('columna','columnb');
order.hasMany('lines',orderLine_order_relation);*/