const getSessionSingleton = require('../getSessionSingleton');
var newParameterized = require('../query/newParameterized');

function newUpdateCommandCore(context, table, columns, row) {
	const quote = getSessionSingleton(context, 'quote');
	var command = newParameterized('UPDATE ' + quote(table._dbName) + ' SET');
	var separator = ' ';

	addColumns();
	addWhereId();
	addDiscriminators();

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

	return command;


}

module.exports = newUpdateCommandCore;