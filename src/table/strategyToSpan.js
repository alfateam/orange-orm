var newCollection = require('../newCollection');
var newQueryContext = require('./query/singleQuery/newQueryContext');
var purifyStrategy = require('./purifyStrategy');

function toSpan(table,strategy) {
	var span = {};
	span.legs = newCollection();
	span.table = table;
	strategy = purifyStrategy(table, strategy);
	applyStrategy(table,span,strategy);
	span.queryContext = newQueryContext();
	span.queryContext.strategy = strategy;
	return span;

	function applyStrategy(table,span,strategy) {
		let columns = new Map();
		var legs = span.legs;
		if(!strategy)
			return;
		for (var name in strategy) {
			if (table._relations[name] && !strategy[name])
				continue;
			if (table._relations[name])
				addLeg(legs,table,strategy,name);
			else if (table[name] && table[name].eq)
				columns.set(table[name], strategy[name]);
			else
				span[name] = strategy[name];
		}
		span.columns = columns;
	}

	function addLeg(legs,table,strategy,name) {
		var relation = table._relations[name];
		var leg = relation.toLeg();
		legs.add(leg);
		var subStrategy = strategy[name];
		var childTable = relation.childTable;
		applyStrategy(childTable,leg.span,subStrategy);
	}
}

module.exports = toSpan;