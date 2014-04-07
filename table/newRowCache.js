var newDomainCache = require('./newDomainCache');

function newRowCache(table) {
	var c = {};
	var cache = newDomainCache();
	var pkNames;
	var rowToKey = firstRowToKey;

	function getPkNames() {
		var names = {};		
		var primaryColumns = table._primaryColumns;		
		var keyLength = primaryColumns.length;
		for (var i = 0; i < keyLength; i++) {
			column = primaryColumns[i];
			names[column.alias] = null;
		};
		return names;
	};

	c.tryGet = function(row) {
		var key = rowToKey(row);
		return cache.tryGet(key);

	};

	function firstRowToKey(row) {
		pkNames = getPkNames();
		rowToKey = nextRowToKey;
		table = null;
		return rowToKey(row);
	}

	function nextRowToKey(row) {		
		var key = [];
		for(var pkName in pkNames) {
			key.push(row[pkName]);
		};
		return key;
	};

	c.tryAdd = function(row) {
		var key = rowToKey(row);
		return cache.tryAdd(key, row);
	};

	c.getAll = cache.getAll;

	return c;
};

module.exports = newRowCache;