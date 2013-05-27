
function extract(table) {
	var lengthWithStrategy = table.primaryColumns.length  + 2;
	if (arguments.length == lengthWithStrategy)
		return arguments[lengthWithStrategy-1];
	return emptyStrategy;
}

function emptyStrategy() {
	
}

module.exports = extract;