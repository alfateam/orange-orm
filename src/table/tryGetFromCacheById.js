function tryGet(context, table) {
	var fakeRow = {};
	var args = arguments;
	table._primaryColumns.forEach(addPkValue);

	function addPkValue(pkColumn, index){
		fakeRow[pkColumn.alias] = args[index + 2];
	}

	return table._cache.tryGet(context, fakeRow);
}
module.exports = tryGet;