function negotiateColumnStrategy(table, strategy) {
	if (!strategy)
		return strategy;
	let newStrategy = {};
	let hasIncludedColumns;
	let columns = new Map();
	for (var name in strategy) {
		if (strategy[name] === null)
			strategy[name] = true;

		if (table._relations[name] && !strategy[name])
			continue;
		if (table._relations[name])
			newStrategy[name] = addLeg(table, strategy, name, columns);
		else if (table[name] && table[name].eq) {
			columns.set(table[name], strategy[name]);
			hasIncludedColumns = hasIncludedColumns || strategy[name];
		}
		else
			newStrategy[name] = strategy[name];
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
		columns.forEach((value, key) => newStrategy[key] = value);
	}
	return newStrategy;

}

function addLeg(table, strategy, name, columns) {
	var relation = table._relations[name];
	if (!relation.joinRelation) {
		for (let i = 0; i < relation.columns.length; i++) {
			columns.set(relation.columns[i], true);
		}
	}
	var subStrategy = strategy[name];
	var childTable = relation.childTable;
	return negotiateColumnStrategy(childTable, subStrategy);
}

module.exports = negotiateColumnStrategy;