var removeFromCache = require('./delete/removeFromCache');
var pushCommand = require('../commands/pushCommand');
var newDeleteCommand = require('../commands/newDeleteCommand');
var newPrimaryKeyFilter = require('../newPrimaryKeyFilter');
var createPatch = require('../../client/createPatch');
var createDto = require('./toDto/createDto');

function _delete(context, row, strategy, table) {
	var relations = [];
	removeFromCache(context, row, strategy, table);

	var args = [context, table];
	table._primaryColumns.forEach(function(primary) {
		args.push(row[primary.alias]);
	});
	var filter = newPrimaryKeyFilter.apply(null, args);
	var cmds = newDeleteCommand(context, [], table, filter, strategy, relations);
	cmds.forEach(function(cmd) {
		pushCommand(context, cmd);
	});
	var cmd = cmds[0];
	if (table._emitChanged.callbacks.length > 0) {
		cmd.disallowCompress = true;
		var dto = createDto(table, row);
		let patch =  createPatch([dto],[]);
		cmd.emitChanged = table._emitChanged.bind(null, {row: row, patch: patch}); //todo remove ?
	}

}

module.exports = _delete;