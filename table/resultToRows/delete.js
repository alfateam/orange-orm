var removeFromCache = require('./delete/removeFromCache');	
var pushCommand = require('../commands/pushCommand');
var newDeleteCommand = require('../commands/newDeleteCommand');
var newPrimaryKeyFilter = require('../newPrimaryKeyFilter');
var alias = '_0';

function _delete(row, strategy, table) {
	var relations = [];
	removeFromCache(row, strategy, table);

	var args = [table];
	table._primaryColumns.forEach(function(primary) {
		args.push(row[primary.alias]);
	})
	var filter = newPrimaryKeyFilter.apply(null, args);
	var cmds = newDeleteCommand([], table, filter, strategy, alias, relations	);
	cmds.forEach(function(cmd) {
		pushCommand(cmd);
	});
};

module.exports = _delete;