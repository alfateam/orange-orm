function purifyStrategy(table, strategy, columns = new Map()) {
	if (!strategy)
		return strategy;
	if (strategy === null)
		return true;
	if (strategy !== Object(strategy))
		return strategy;

	strategy = { ...strategy };
	for (let p in strategy) {
		if (strategy[p] === null)
			strategy[p] = true;
	}

	let hasIncludedColumns;
	for (let name in strategy) {
		if (table._relations[name] && !strategy[name])
			continue;
		else if (table._relations[name])
			strategy[name] = addLeg(table._relations[name], strategy[name], columns);
		else if (table[name] && table[name].eq) {
			columns.set(table[name], strategy[name]);
			hasIncludedColumns = hasIncludedColumns || strategy[name];
		}
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
		columns.forEach((value, key) => strategy[key.alias] = value);
	}

	return strategy;

}

function addLeg(relation, strategy, columns) {
	let nextColumns = new Map();
	if (!relation.joinRelation)
		for (let i = 0; i < relation.columns.length; i++) {
			columns.set(relation.columns[i], true);
		}
	else
		relation.joinRelation.columns.forEach(column => {
			nextColumns.set(column, true);
		});
	let childTable = relation.childTable;
	return purifyStrategy(childTable, strategy, nextColumns);
}

module.exports = purifyStrategy;