var newCollection = require('../newCollection');
var newQueryContext = require('./query/singleQuery/newQueryContext');


function toSpan(table,strategy) {
	var span = {};
	span.queryContext = newQueryContext();
	span.legs = newCollection();
	span.table = table;
	applyStrategy(table,span,strategy);
	return span;

	function applyStrategy(table,span,strategy) {
		var legs = span.legs;
		if(!strategy)
			return;
		for (var name in strategy) {
			if (table._relations[name])
				addLeg(legs,table,strategy,name);
			else
				span[name] = strategy[name];
		}
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