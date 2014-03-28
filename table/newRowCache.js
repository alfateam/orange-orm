var newDomainCache = require('./newDomainCache');

function newRowCache(table) {
	var c = {};
	var pkNames = getPkNames();
	table = null;
	var cache = newDomainCache();

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

	function rowToKey(row) {
		var key = [];
		for(var pkName in pkNames) {
			key.push(row[pkName]);
		};
		return key;
	};

	c.add = function(row) {
		var key = rowToKey(row);
		cache.add(key, row);
	};

	return c;
};

module.exports = newRowCache;