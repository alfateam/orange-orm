var removeFromCache = require('./delete/removeFromCache');
var pushCommand = require('../commands/pushCommand');
var newDeleteCommand = require('../commands/newDeleteCommand');
var newPrimaryKeyFilter = require('../newPrimaryKeyFilter');
var createPatch = require('rdb-client').createPatch;
var createDto = require('./toDto/createDto');

function _delete(row, strategy, table) {
	var relations = [];
	removeFromCache(row, strategy, table);

	var args = [table];
	table._primaryColumns.forEach(function(primary) {
		args.push(row[primary.alias]);
	});
	var filter = newPrimaryKeyFilter.apply(null, args);
	var cmds = newDeleteCommand([], table, filter, strategy, relations);
	cmds.forEach(function(cmd) {
		pushCommand(cmd);
	});
	var cmd = cmds[0];
	if (table._emitChanged.callbacks.length > 0) {
		cmd.disallowCompress = true;
		var dto = createDto(table, row);
		let patch =  createPatch([dto],[]);
		cmd.emitChanged = table._emitChanged.bind(null, {row: row, patch: patch});
	}

}

module.exports = _delete;