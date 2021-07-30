var newCollection = require('../newCollection');
var newQueryContext = require('./query/singleQuery/newQueryContext');

function toSpan(table,strategy) {
	var span = {};
	span.queryContext = newQueryContext();
	span.queryContext.strategy = strategy;
	span.legs = newCollection();
	span.table = table;
	applyStrategy(table,span,strategy);
	return span;

	function applyStrategy(table,span,strategy) {
		let hasIncludedColumns;
		let columns = new Map();
		var legs = span.legs;
		if(!strategy)
			return;
		for (var name in strategy) {
			if (strategy[name] === null)
				strategy[name] = true;
			if (table._relations[name] && !strategy[name])				
				continue;
			if (table._relations[name])
				addLeg(legs,table,strategy,name, columns);
			else if (table[name] && table[name].eq)  {
				columns.set(table[name], strategy[name]);
				hasIncludedColumns = hasIncludedColumns  || strategy[name];
			}
			else 
				span[name] = strategy[name];
		}
		if (!hasIncludedColumns)
			table._columns.forEach(column => {
				if (!columns.has(column))
					columns.set(column, true);
			});
		if (columns.size > 0) {
			table._primaryColumns.forEach(col => {
				columns.set(col, true);
			});
			span.columns = columns;
		}
	}

	function addLeg(legs,table,strategy,name, columns) {
		var relation = table._relations[name];
		var leg = relation.toLeg();
		if (!relation.joinRelation) {
			for (let i = 0; i < relation.columns.length; i++) {
				columns.set(relation.columns[i], true);
			}
		}
		legs.add(leg);
		var subStrategy = strategy[name];
		var childTable = relation.childTable;
		applyStrategy(childTable,leg.span,subStrategy);
	}
}

module.exports = toSpan;