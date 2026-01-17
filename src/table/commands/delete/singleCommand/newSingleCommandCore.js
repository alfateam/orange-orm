var getSessionSingleton = require('../../../getSessionSingleton');
var newParameterized = require('../../../query/newParameterized');

function newSingleCommandCore(context, table, filter, alias, concurrencyState) {
	var c = {};
	var quote = getSessionSingleton(context, 'quote');
	var engine = getSessionSingleton(context, 'engine');
	var concurrency = buildConcurrencyChecks(concurrencyState);
	var parameters = filter.parameters ? filter.parameters.slice() : [];
	if (concurrency && concurrency.parameters.length > 0)
		parameters = parameters.concat(concurrency.parameters);

	c.sql = function() {
		var whereSql = filter.sql();
		if (concurrency && concurrency.sql) {
			if (whereSql)
				whereSql += ' AND ' + concurrency.sql;
			else
				whereSql = concurrency.sql;
		}
		if (whereSql)
			whereSql = ' where ' + whereSql;
		var deleteFromSql = getSessionSingleton(context, 'deleteFromSql');
		return deleteFromSql(table, alias, whereSql);
	};

	c.parameters = parameters;

	return c;

	function buildConcurrencyChecks(state) {
		const columnsState = state && state.columns;
		if (!columnsState)
			return;
		const parts = [];
		const params = [];
		for (let alias in columnsState) {
			const columnState = columnsState[alias];
			if (!columnState || columnState.concurrency === 'overwrite')
				continue;
			const column = table[alias];
			if (!column)
				continue;
			const encoded = (engine === 'mysql' && column.tsType === 'JSONColumn')
				? encodeJsonValue(columnState.oldValue, column)
				: column.encode(context, columnState.oldValue);
			const comparison = buildNullSafeComparison(column, encoded);
			if (comparison.sql)
				parts.push(comparison.sql());
			if (comparison.parameters.length > 0)
				params.push(...comparison.parameters);
		}
		if (parts.length === 0)
			return;
		return { sql: parts.join(' AND '), parameters: params };
	}

	function buildNullSafeComparison(column, encoded) {
		const columnSql = quote(column._dbName);
		if (engine === 'pg') {
			return newParameterized(columnSql + ' IS NOT DISTINCT FROM ' + encoded.sql(), encoded.parameters);
		}
		if (engine === 'mysql') {
			return newParameterized(columnSql + ' <=> ' + encoded.sql(), encoded.parameters);
		}
		if (engine === 'sqlite') {
			return newParameterized(columnSql + ' IS ' + encoded.sql(), encoded.parameters);
		}
		if (engine === 'sap' && column.tsType === 'JSONColumn') {
			if (encoded.sql() === 'null')
				return newParameterized(columnSql + ' IS NULL');
			const casted = newParameterized('CONVERT(VARCHAR(16384), ' + encoded.sql() + ')', encoded.parameters);
			return newParameterized('CONVERT(VARCHAR(16384), ' + columnSql + ')=' + casted.sql(), casted.parameters);
		}
		if (engine === 'oracle' && column.tsType === 'JSONColumn') {
			if (encoded.sql() === 'null')
				return newParameterized(columnSql + ' IS NULL');
			const jsonValue = newParameterized('JSON(' + encoded.sql() + ')', encoded.parameters);
			return newParameterized('JSON_EQUAL(' + columnSql + ', ' + jsonValue.sql() + ')', jsonValue.parameters);
		}
		if (encoded.sql() === 'null')
			return newParameterized(columnSql + ' IS NULL');
		return newParameterized(columnSql + '=' + encoded.sql(), encoded.parameters);
	}

	function encodeJsonValue(value, column) {
		if (engine === 'oracle') {
			if (value === null || value === undefined)
				return newParameterized('null');
			if (isJsonObject(value))
				return column.encode(context, value);
			if (typeof value === 'boolean' || typeof value === 'number')
				return newParameterized('?', [String(value)]);
			return newParameterized('?', [value]);
		}
		if (engine === 'pg') {
			const jsonValue = JSON.stringify(value === undefined ? null : value);
			return newParameterized('?::jsonb', [jsonValue]);
		}
		if (engine === 'mysql') {
			const jsonValue = JSON.stringify(value === undefined ? null : value);
			return newParameterized('CAST(? AS JSON)', [jsonValue]);
		}
		if (engine === 'sqlite') {
			if (isJsonObject(value)) {
				const jsonValue = JSON.stringify(value);
				return newParameterized('?', [jsonValue]);
			}
			if (value === null || value === undefined)
				return newParameterized('null');
			return newParameterized('?', [value]);
		}
		if (engine === 'mssql' || engine === 'mssqlNative') {
			if (isJsonObject(value))
				return newParameterized('JSON_QUERY(?)', [JSON.stringify(value)]);
			if (value === null || value === undefined)
				return newParameterized('null');
			return newParameterized('?', [String(value)]);
		}
		return column.encode(context, value);
	}

	function isJsonObject(value) {
		return value && typeof value === 'object';
	}
}

module.exports = newSingleCommandCore;
