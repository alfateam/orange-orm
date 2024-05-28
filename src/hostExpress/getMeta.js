function getMeta(table, map = new Map()) {
	if (map.has(table))
		return map.get(table).id;
	let strategy = {
		keys: table._primaryColumns.map(x => ({name: x.alias, type: x.tsType})),
		columns: {},
		relations: {},
		id: map.size
	};
	map.set(table, strategy);

	for (let i = 0; i < table._columns.length; i++) {
		const column = table._columns[i];
		strategy.columns[column.alias] = {};
		if ('serializable' in column && !column.serializable)
			strategy.columns[column.alias].serializable = false;
		else
			strategy.columns[column.alias].serializable = true;
	}

	let relations = table._relations;
	let relationName;

	let visitor = {};
	visitor.visitJoin = function(relation) {
		strategy.relations[relationName] = getMeta(relation.childTable, map);
	};

	visitor.visitMany = function(relation) {
		strategy.relations[relationName] = getMeta(relation.childTable, map);
	};

	visitor.visitOne = visitor.visitMany;

	for (relationName in relations) {
		let relation = relations[relationName];
		relation.accept(visitor);
	}
	return strategy;
}

module.exports = getMeta;