const executeCommand = require('../table/executeQueries/executeCommand');
const newParameterized = require('../table/query/newParameterized');
const quote = require('./quote');

async function batchInsert(context, table, rows, options = {}) {
	const groups = groupRows(table, rows);
	for (let i = 0; i < groups.length; i++) {
		if (groups[i].columns.length === 0)
			return false;
	}
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		await executeGroup(context, table, group, options);
	}
	return true;
}

async function executeGroup(context, table, group, options) {
	const maxParameters = context.rdb.maxParameters || 999;
	const columns = group.columns;
	const chunks = chunkRows(context, group.rows, columns, maxParameters);

	for (let i = 0; i < chunks.length; i++)
		await executeCommand(context, buildCommand(context, table, columns, chunks[i], options));
}

function buildCommand(context, table, columns, rows, options) {
	const parameters = [];
	const columnNames = discriminatorColumnNames(table).concat(columns.map(column => quote(column._dbName)));
	const valueRows = rows.map(row => {
		const values = discriminatorValues(table).concat(columns.map(column => {
			const encoded = column.encode(context, row[column.alias]);
			parameters.push(...encoded.parameters);
			return encoded.sql();
		}));
		return '(' + values.join(',') + ')';
	});

	const sql = 'INSERT INTO ' + quote(table._dbName) + ' (' + columnNames.join(',') + ') VALUES '
		+ valueRows.join(',') + onConflict(table, columns, options);
	return newParameterized(sql, parameters);
}

function groupRows(table, rows) {
	const groups = [];
	const groupsByKey = {};
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const columns = table._columns.filter(column => row['__' + column.alias] !== undefined);
		const key = columns.map(column => column.alias).join('\0');
		let group = groupsByKey[key];
		if (!group) {
			group = { columns, rows: [] };
			groupsByKey[key] = group;
			groups.push(group);
		}
		group.rows.push(row);
	}
	return groups;
}

function countParameterColumns(context, row, columns) {
	let count = 0;
	for (let i = 0; i < columns.length; i++) {
		const encoded = columns[i].encode(context, row[columns[i].alias]);
		count += encoded.parameters.length;
	}
	return count;
}

function chunkRows(context, rows, columns, maxParameters) {
	const chunks = [];
	let chunk = [];
	let parameterCount = 0;
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowParameterCount = countParameterColumns(context, row, columns);
		if (chunk.length > 0 && parameterCount + rowParameterCount > maxParameters) {
			chunks.push(chunk);
			chunk = [];
			parameterCount = 0;
		}
		chunk.push(row);
		parameterCount += rowParameterCount;
	}
	if (chunk.length > 0)
		chunks.push(chunk);
	return chunks;
}

function discriminatorColumnNames(table) {
	return table._columnDiscriminators.map(discriminator => quote(discriminator.split('=')[0]));
}

function discriminatorValues(table) {
	return table._columnDiscriminators.map(discriminator => discriminator.split('=')[1]);
}

function onConflict(table, columns, options) {
	if (options.concurrency !== 'skipOnConflict' && options.concurrency !== 'overwrite')
		return '';

	const primaryKeys = table._primaryColumns.map(x => quote(x._dbName)).join(',');
	const updates = [];
	for (let i = 0; i < columns.length; i++) {
		const column = columns[i];
		const concurrency = options[column.alias]?.concurrency || options.concurrency;
		const columnName = quote(column._dbName);
		if (concurrency === 'overwrite')
			updates.push(`${columnName}=excluded.${columnName}`);
		else if (concurrency === 'optimistic')
			updates.push(`${columnName} = CASE WHEN ${table._dbName}.${columnName} <> excluded.${columnName} THEN '12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' ELSE ${table._dbName}.${columnName} END`);
	}

	if (updates.length === 0)
		return ` ON CONFLICT(${primaryKeys}) DO NOTHING`;
	return ` ON CONFLICT(${primaryKeys}) DO UPDATE SET ${updates.join(',')}`;
}

module.exports = batchInsert;
