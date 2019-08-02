var newParameterized = require('../query/newParameterized');

function newUpdateCommandCore(table, columns, row) {
	var command = newParameterized('UPDATE ' + table._dbName + ' SET');
	var separator = ' ';

	addColumns();
	addWhereId();
	addDiscriminators();

	function addColumns() {
		for (var alias in columns) {
			var column = columns[alias];
			var encoded = column.encode(row[alias]);
			command = command.append(separator + column._dbName + '=').append(encoded);
			separator = ',';
		}
	}

	function addWhereId() {
		separator = ' WHERE ';
		var columns = table._primaryColumns;
		for (var i = 0; i < columns.length; i++) {
			var column = columns[i];
			var value = row[column.alias];
			var encoded = column.encode(value);
			command = command.append(separator + column._dbName + '=').append(encoded);
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