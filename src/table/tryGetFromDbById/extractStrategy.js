
function extract(_context, table) {
	var lengthWithStrategy = table._primaryColumns.length  + 3;
	if (arguments.length === lengthWithStrategy)
		return arguments[lengthWithStrategy-1];
	return;
}

module.exports = extract;