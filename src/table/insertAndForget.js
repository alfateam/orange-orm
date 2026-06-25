const fromCompareObject = require('../fromCompareObject');
const getSessionContext = require('./getSessionContext');
const newRow = require('./commands/newRow');

async function insertAndForget(context, { table, options = {} }, values) {
	if (!Array.isArray(values) || values.length === 0)
		return false;

	const normalizedValues = [];
	for (let i = 0; i < values.length; i++) {
		if (!isFlatColumnValue(values[i], table))
			return false;
		normalizedValues.push(normalizeValue(values[i], table));
	}

	const insertOptions = { ...options, skipSelectAfterInsert: true };
	const rows = normalizedValues.map(value => newRow(context, { table }, value));
	const rdb = getSessionContext(context);
	if (rows.length > 1 && rdb.batchInsert && table._emitChanged.callbacks.length === 0) {
		const inserted = await rdb.batchInsert(context, table, rows, insertOptions);
		if (inserted)
			return true;
	}

	for (let i = 0; i < normalizedValues.length; i++)
		await table.insertWithConcurrency(context, insertOptions, normalizedValues[i]);
	return true;
}

function isFlatColumnValue(value, table) {
	if (!isPlainObject(value))
		return false;
	for (let name in value) {
		if (!isColumn(name, table))
			return false;
	}
	return true;
}

function normalizeValue(value, table) {
	const normalized = {};
	for (let name in value) {
		if (isColumn(name, table))
			normalized[name] = fromCompareObject(value[name]);
	}
	clearTemporaryPrimaryKeys(normalized, table);
	return normalized;
}

function clearTemporaryPrimaryKeys(value, table) {
	for (let i = 0; i < table._primaryColumns.length; i++) {
		const pkName = table._primaryColumns[i].alias;
		const keyValue = value[pkName];
		if (keyValue && typeof keyValue === 'string' && keyValue.indexOf('~') === 0)
			value[pkName] = undefined;
	}
}

function isColumn(name, table) {
	return table[name] && table[name].equal;
}

function isPlainObject(value) {
	return value === Object(value) && !Array.isArray(value) && !(value instanceof Date);
}

module.exports = insertAndForget;
