var newResolver = require('./resolveExecuteCommand');

function executeCommand(context, query) {
	var resolver = newResolver(context, query);
	return new Promise(resolver);
}

module.exports = executeCommand;