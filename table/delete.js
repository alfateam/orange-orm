var pushCommand = require('./commands/pushCommand');
var newDeleteCommand = require('./commands/newDeleteCommand');
var extractDeleteStrategy = require('./extractDeleteStrategy');
var emptyPromise = require('./resultToPromise')();

function _delete(table, filter, strategy) {
	strategy = extractDeleteStrategy(strategy);
	var relations = [];
	var cmds = [];

	cmds = newDeleteCommand(cmds, table, filter, strategy, relations);
	cmds.forEach(function(cmd) {
		pushCommand(cmd);
	});
	return emptyPromise;
};

module.exports = _delete;