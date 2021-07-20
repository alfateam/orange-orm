var extractStrategy = require('./resultToRows/toDto/extractStrategy');

function extractStrategyForId(table, args) {
	args = [...args];
	if (args.length <= table._primaryColumns.length)
		return args;
	let strategyPosition = table._primaryColumns.length;
	let strategy = args[strategyPosition];
	if (strategy === undefined)
		args.splice(strategyPosition, 1, extractStrategy(table));
	return args;
}

module.exports = extractStrategyForId;