const getSessionSingleton = require('../getSessionSingleton');
var newParameterized = require('../query/newParameterized');

function newUpdateCommandCore(context, table, columns, row, concurrencyState) {
	const quote = getSessionSingleton(context, 'quote');
	const engine = getSessionSingleton(context, 'engine');
	var command = newParameterized('UPDATE ' + quote(table._dbName) + ' SET');
	var separator = ' ';

	addColumns();
	addWhereId();
	addDiscriminators();
	addConcurrencyChecks();

	function addColumns() {
		for (var alias in columns) {
			var column = columns[alias];
			const columnSql = quote(column._dbName);
			const jsonUpdate = row._jsonUpdateState && row._jsonUpdateState[alias];
			if (jsonUpdate && jsonUpdate.patches && jsonUpdate.patches.length) {
				const updated = buildJsonUpdateExpression(columnSql, jsonUpdate.patches, column);
				command = command.append(separator + columnSql + '=').append(updated);
			}
			else {
				var encoded = column.encode(context, row[alias]);
				command = command.append(separator + columnSql + '=').append(encoded);
			}
			separator = ',';
		}
	}

	function addWhereId() {
		separator = ' WHERE ';
		var columns = table._primaryColumns;
		for (var i = 0; i < columns.length; i++) {
			var column = columns[i];
			var value = row[column.alias];
			var encoded = column.encode(context, value);
			command = command.append(separator + quote(column._dbName) + '=').append(encoded);
			separator = ' AND ';
		}
	}

	function addDiscriminators() {
		var discriminators = table._columnDiscriminators;
		if (discriminators.length === 0)
			return;
		discriminators = separator + discriminators.join(' AND ');
		command = command.append(discriminators);
	}

	function addConcurrencyChecks() {
		const columnsState = concurrencyState && concurrencyState.columns;
		if (!columnsState)
			return;
		for (let alias in columnsState) {
			const state = columnsState[alias];
			if (!state || state.concurrency === 'overwrite')
				continue;
			const column = table[alias];
			if (!column)
				continue;
			if (state.paths && state.paths.length) {
				for (let i = 0; i < state.paths.length; i++) {
					const pathState = state.paths[i];
					const encoded = encodeJsonValue(pathState.oldValue, column);
					const jsonPath = buildJsonPath(pathState.path);
					const columnExpr = buildJsonExtractExpression(quote(column._dbName), jsonPath, pathState.oldValue);
					command = appendJsonPathComparison(columnExpr, encoded);
				}
			}
			else {
				const encoded = column.encode(context, state.oldValue);
				command = appendNullSafeComparison(column, encoded);
			}
		}
	}

	function appendNullSafeComparison(column, encoded) {
		const columnSql = quote(column._dbName);
		if (engine === 'pg') {
			command = command.append(separator + columnSql + ' IS NOT DISTINCT FROM ').append(encoded);
		}
		else if (engine === 'mysql') {
			command = command.append(separator + columnSql + ' <=> ').append(encoded);
		}
		else if (engine === 'sqlite') {
			command = command.append(separator + columnSql + ' IS ').append(encoded);
		}
		else if (engine === 'sap' && column.tsType === 'JSONColumn') {
			if (encoded.sql() === 'null') {
				command = command.append(separator + columnSql + ' IS NULL');
			}
			else {
				const casted = newParameterized('CONVERT(VARCHAR(16384), ' + encoded.sql() + ')', encoded.parameters);
				command = command.append(separator + 'CONVERT(VARCHAR(16384), ' + columnSql + ')=') .append(casted);
			}
		}
		else {
			if (encoded.sql() === 'null')
				command = command.append(separator + columnSql + ' IS NULL');
			else
				command = command.append(separator + columnSql + '=').append(encoded);
		}
		separator = ' AND ';
		return command;
	}

	function appendJsonPathComparison(columnExpr, encoded) {
		if (engine === 'pg') {
			command = command.append(separator).append(columnExpr).append(' IS NOT DISTINCT FROM ').append(encoded);
		}
		else if (engine === 'mysql') {
			command = command.append(separator).append(columnExpr).append(' <=> ').append(encoded);
		}
		else if (engine === 'sqlite') {
			command = command.append(separator).append(columnExpr).append(' IS ').append(encoded);
		}
		else {
			if (encoded.sql() === 'null')
				command = command.append(separator).append(columnExpr).append(' IS NULL');
			else
				command = command.append(separator).append(columnExpr).append('=').append(encoded);
		}
		separator = ' AND ';
		return command;
	}

	function buildJsonUpdateExpression(columnSql, patches, column) {
		if (!isJsonUpdateSupported(engine))
			return column.encode(context, row[column.alias]);
		let expr = newParameterized(columnSql);
		for (let i = 0; i < patches.length; i++) {
			const patch = patches[i];
			expr = applyJsonPatchExpression(expr, patch, column);
		}
		return expr;
	}

	function applyJsonPatchExpression(expr, patch, column) {
		const path = patch.path || [];
		const jsonPath = buildJsonPath(path);
		if (patch.op === 'remove')
			return buildJsonRemoveExpression(expr, jsonPath);
		return buildJsonSetExpression(expr, jsonPath, patch.value, column);
	}

	function buildJsonSetExpression(expr, jsonPath, value, column) {
		if (engine === 'pg') {
			const pathLiteral = buildPgPathLiteral(jsonPath.tokens);
			const jsonValue = JSON.stringify(value === undefined ? null : value);
			const sql = 'jsonb_set(' + expr.sql() + ', ' + pathLiteral + ', ?::jsonb, true)';
			return newParameterized(sql, expr.parameters.concat([jsonValue]));
		}
		if (engine === 'mysql') {
			const jsonValue = JSON.stringify(value === undefined ? null : value);
			const sql = 'JSON_SET(' + expr.sql() + ', ' + jsonPath.sql + ', CAST(? AS JSON))';
			return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, [jsonValue]));
		}
		if (engine === 'sqlite') {
			const jsonValue = JSON.stringify(value === undefined ? null : value);
			const sql = 'json_set(' + expr.sql() + ', ' + jsonPath.sql + ', json(?))';
			return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, [jsonValue]));
		}
		if (engine === 'mssql' || engine === 'mssqlNative') {
			const mssqlValue = buildMssqlJsonValue(value);
			const sql = 'JSON_MODIFY(' + expr.sql() + ', ' + jsonPath.sql + ', ' + mssqlValue.sql() + ')';
			return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, mssqlValue.parameters));
		}
		return column.encode(context, row[column.alias]);
	}

	function buildJsonRemoveExpression(expr, jsonPath) {
		if (engine === 'pg') {
			const pathLiteral = buildPgPathLiteral(jsonPath.tokens);
			const sql = expr.sql() + ' #- ' + pathLiteral;
			return newParameterized(sql, expr.parameters);
		}
		if (engine === 'mysql') {
			const sql = 'JSON_REMOVE(' + expr.sql() + ', ' + jsonPath.sql + ')';
			return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
		}
		if (engine === 'sqlite') {
			const sql = 'json_remove(' + expr.sql() + ', ' + jsonPath.sql + ')';
			return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
		}
		if (engine === 'mssql' || engine === 'mssqlNative') {
			const sql = 'JSON_MODIFY(' + expr.sql() + ', ' + jsonPath.sql + ', NULL)';
			return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
		}
		return expr;
	}

	function buildJsonExtractExpression(columnSql, jsonPath, oldValue) {
		if (engine === 'pg') {
			const sql = columnSql + ' #> ' + buildPgPathLiteral(jsonPath.tokens);
			return newParameterized(sql);
		}
		if (engine === 'mysql') {
			const sql = 'JSON_EXTRACT(' + columnSql + ', ' + jsonPath.sql + ')';
			return newParameterized(sql, jsonPath.parameters);
		}
		if (engine === 'sqlite') {
			const sql = 'json_extract(' + columnSql + ', ' + jsonPath.sql + ')';
			return newParameterized(sql, jsonPath.parameters);
		}
		if (engine === 'mssql' || engine === 'mssqlNative') {
			const fn = isJsonObject(oldValue) ? 'JSON_QUERY' : 'JSON_VALUE';
			const sql = fn + '(' + columnSql + ', ' + jsonPath.sql + ')';
			return newParameterized(sql, jsonPath.parameters);
		}
		return newParameterized(columnSql);
	}

	function buildJsonPath(pathTokens) {
		const tokens = Array.isArray(pathTokens) ? pathTokens : [];
		if (engine === 'pg')
			return { tokens, sql: buildPgPathLiteral(tokens), parameters: [] };
		let jsonPath = '$';
		for (let i = 0; i < tokens.length; i++) {
			const token = String(tokens[i]);
			if (/^\d+$/.test(token))
				jsonPath += '[' + token + ']';
			else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token))
				jsonPath += '.' + token;
			else
				jsonPath += '["' + token.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
		}
		return { tokens, sql: '?', parameters: [jsonPath] };
	}

	function buildPgPathLiteral(tokens) {
		const parts = tokens.map(token => {
			const text = String(token);
			if (/^[A-Za-z0-9_]+$/.test(text))
				return text;
			return '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
		});
		return '\'{'+ parts.join(',') + '}\'';
	}

	function encodeJsonValue(value, column) {
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

	function buildMssqlJsonValue(value) {
		if (isJsonObject(value))
			return newParameterized('JSON_QUERY(?)', [JSON.stringify(value)]);
		if (value === null || value === undefined)
			return newParameterized('null');
		return newParameterized('?', [value]);
	}

	function isJsonObject(value) {
		return value && typeof value === 'object';
	}

	function isJsonUpdateSupported(engine) {
		return engine === 'pg' || engine === 'mysql' || engine === 'sqlite' || engine === 'mssql' || engine === 'mssqlNative';
	}

	return command;


}

module.exports = newUpdateCommandCore;
