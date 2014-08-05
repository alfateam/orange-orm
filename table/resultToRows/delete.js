var removeFromCache = require('./delete/removeFromCache');	
var pushCommand = require('../commands/pushCommand');
var newDeleteCommand = require('../commands/newDeleteCommand');
var newPrimaryKeyFilter = require('../newPrimaryKeyFilter');
var strategyToSpan = require('../strategyToSpan');
var innerJoin = require('../query/newParameterized')();
var alias = '_0';

function _delete(row, strategy, table) {
	removeFromCache(row, strategy, table);
	var span = strategyToSpan(table, strategy);

	var args = [table];
	table._primaryColumns.forEach(function(primary) {
		args.push(row[primary.alias]);
	})
	var filter = newPrimaryKeyFilter.apply(null, args);
	var cmds = newDeleteCommand([], table, filter, span, alias, innerJoin);
	cmds.forEach(function(cmd) {
		pushCommand(cmd);
	});
};

module.exports = _delete;