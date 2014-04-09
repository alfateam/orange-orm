var newRow = require('./commands/newRow');
var newInsertCommand = require('./commands/newInsertCommand');
var pushCommand = require('./commands/pushCommand');

function insert(table, id, id2)  {
	var args = [].slice.call(arguments);
	var row = newRow.apply(null, args);
	row = table._cache.tryAdd(row);
	var cmd = newInsertCommand(row);
	pushCommand(cmd);
	return row;
}

module.exports = insert;