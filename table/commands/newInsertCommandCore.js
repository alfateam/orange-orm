var newParameterized = require('../query/newParameterized');

function newInsertCommandCore(table, row) {
	var columnNames = [];
	var values = [];
	var command = "INSERT INTO " + table._dbName + " (";

	parseColumns();
	parseDiscriminators();
	addColumnNames();
	addValues();

	function parseColumns() {		
		var columns = table._columns;
		for (var i = 0; i < columns.length; i++) {
			var column = columns[i];
			var alias = column.alias;
			var encoded = column.encode(row[alias]);
			columnNames.push(column._dbName);
			values.push(encoded);
		}
	}

	function parseDiscriminators() {
		var discriminators = table._columnDiscriminators;
		for (var i = 0; i < discriminators.length; i++) {
			var parts = discriminators[i].split("=");
			columnNames.push(parts[0]);
			values.push(parts[1]);
		}
	}

	function addColumnNames() {
		command = newParameterized(command + columnNames.join(",") + ") VALUES ");
	}

	function addValues() {
		var add = addFirst;
		for (var i = 0; i < values.length; i++) {
			add(i);			
		}

		function addFirst() {
			addCore(i,"(");
			add = addNext;
		}

		function addNext(i) {
			addCore(i,",");
		}

		function addCore(i, separator) {
			command = command.append(separator);
			command = command.append(values[i]);								
		}

		command = command.append(")");
	}

	return command;


}

module.exports = newInsertCommandCore;