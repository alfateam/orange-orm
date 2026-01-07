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
			var encoded = column.encode(context, row[alias]);
			command = command.append(separator + quote(column._dbName) + '=').append(encoded);
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
			const encoded = column.encode(context, state.oldValue);
			command = appendNullSafeComparison(column, encoded);
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
		else {
			if (encoded.sql() === 'null')
				command = command.append(separator + columnSql + ' IS NULL');
			else
				command = command.append(separator + columnSql + '=').append(encoded);
		}
		separator = ' AND ';
		return command;
	}

	return command;


}

module.exports = newUpdateCommandCore;
