var emptyStrategy = require('./emptyStrategy');

function negotiate(table) {
	var argsCount = arguments.length;
	var args = [];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	if (noStrategy())
		args.push(emptyStrategy);
	return args;

	function noStrategy() {
		var columnCount = table.primaryColumns.length;
		return (columnCount+2 != argsCount);

	}
}

module.exports = negotiate;