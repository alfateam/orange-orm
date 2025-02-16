var pushCommand = require('./commands/pushCommand');
var newDeleteCommand = require('./commands/newDeleteCommand');
var extractDeleteStrategy = require('./extractDeleteStrategy');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var emptyPromise = require('./resultToPromise')();

function _delete(context, table, filter, strategy) {
	filter = negotiateRawSqlFilter(context, filter, table);
	strategy = extractDeleteStrategy(strategy);
	var relations = [];
	var cmds = [];

	cmds = newDeleteCommand(context, cmds, table, filter, strategy, relations);
	cmds.forEach(function(cmd) {
		pushCommand(context, cmd);
	});
	return emptyPromise;
}

module.exports = _delete;