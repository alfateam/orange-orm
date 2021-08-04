function tryGet(table) {
	var fakeRow = {};
	var args = arguments;
	table._primaryColumns.forEach(addPkValue);

	function addPkValue(pkColumn, index){
		fakeRow[pkColumn.alias] = args[index + 1];
	}

	return table._cache.tryGet(fakeRow);
}
module.exports = tryGet;