function mapFromSyncSchema(rdb, schema) {
	const schemaTables = Array.isArray(schema && schema.tables) ? schema.tables : [];
	const tableNameByDbName = new Map(schemaTables.map(table => [table.dbName, table.name]));
	let mapped = rdb.map(({ table }) => Object.fromEntries(schemaTables.map(tableSchema => [
		tableSchema.name,
		table(tableSchema.dbName).map(({ column }) => Object.fromEntries(
			(tableSchema.columns || []).map(columnSchema => [
				columnSchema.name,
				mapColumn(column(columnSchema.dbName), columnSchema)
			])
		))
	])));

	mapped = mapped.map(tables => Object.fromEntries(schemaTables.map(tableSchema => [
		tableSchema.name,
		tables[tableSchema.name].map(({ references }) => {
			const relations = {};
			for (let i = 0; i < (tableSchema.foreignKeys || []).length; i++) {
				const foreignKey = tableSchema.foreignKeys[i];
				const referencedName = tableNameByDbName.get(foreignKey.referencesTable);
				if (!referencedName || !tables[referencedName])
					continue;
				const relationName = relationNameForForeignKey(tableSchema, foreignKey, i);
				let relation = references(tables[referencedName]).by(...foreignKey.columns);
				if (foreignKeyIsNotNull(tableSchema, foreignKey))
					relation = relation.notNull();
				relations[relationName] = relation;
			}
			return relations;
		})
	])));

	return mapped;
}

function mapColumn(column, schema) {
	const type = schema && schema.type;
	if (type === 'number')
		column = column.numeric();
	else if (type === 'boolean')
		column = column.boolean();
	else if (type === 'bigint')
		column = column.bigint();
	else if (type === 'binary')
		column = column.binary();
	else if (type === 'json')
		column = column.json();
	else if (type === 'uuid')
		column = column.uuid();
	else if (type === 'datetime-tz')
		column = column.dateWithTimeZone();
	else if (type === 'datetime')
		column = column.date();
	else
		column = column.string();
	if (schema && schema.primary)
		column = column.primary();
	if (schema && schema.notNull)
		column = column.notNull();
	else if (schema && schema.notNullExceptInsert)
		column = column.notNullExceptInsert();
	return column;
}

function relationNameForForeignKey(tableSchema, foreignKey, index) {
	const indexes = Array.isArray(tableSchema && tableSchema.indexes) ? tableSchema.indexes : [];
	const relationIndex = indexes.find(item => item
		&& typeof item.name === 'string'
		&& item.name.startsWith('relation:')
		&& sameStrings(item.columns, foreignKey.columns));
	if (relationIndex)
		return relationIndex.name.slice('relation:'.length);
	return `__orangeSyncReference${index + 1}`;
}

function foreignKeyIsNotNull(tableSchema, foreignKey) {
	const columns = Array.isArray(tableSchema && tableSchema.columns) ? tableSchema.columns : [];
	return foreignKey.columns.every(name => {
		const column = columns.find(item => item && item.dbName === name);
		return column && column.notNull === true;
	});
}

function sameStrings(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
		return false;
	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i])
			return false;
	}
	return true;
}

module.exports = mapFromSyncSchema;
