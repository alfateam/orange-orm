let newCache = require('./newCache');
let getSessionSingleton = require('./getSessionSingleton');
let setSessionSingleton = require('./setSessionSingleton');

function newRowCache(table) {
	let id = Symbol();
	let c = {};

	c.tryGet = function(row) {
		return getCache(table, id).tryGet(row);
	};

	c.tryAdd = function(row) {
		return getCache(table, id).tryAdd(row);
	};

	c.tryRemove = function(row) {
		return getCache(table, id).tryRemove(row);
	};

	c.subscribeAdded = function() {
		return getCache(table, id).subscribeAdded.apply(null, arguments);
	};

	c.subscribeRemoved = function() {
		return getCache(table, id).subscribeRemoved.apply(null, arguments);
	};

	c.getAll = function() {
		return getCache(table, id).getAll.apply(null, arguments);
	};

	c.getInnerCache = function() {
	};
	return c;
}


function getCache(table, id) {
	let cache = getSessionSingleton(id);
	if (cache)
		return cache;
	cache = _newRowCache(table);
	setSessionSingleton(id, cache);
	return cache;
}


function _newRowCache(table) {
	let c = {};
	let cache = newCache();
	let pkNames;
	let rowToKey = firstRowToKey;

	function getPkNames() {
		let names = {};
		let primaryColumns = table._primaryColumns;
		let keyLength = primaryColumns.length;
		for (let i = 0; i < keyLength; i++) {
			let column = primaryColumns[i];
			names[column.alias] = null;
		}
		return names;
	}

	c.tryGet = function(row) {
		let key = rowToKey(row);
		return cache.tryGet(key);

	};

	function firstRowToKey(row) {
		pkNames = getPkNames();
		rowToKey = nextRowToKey;
		table = null;
		return rowToKey(row);
	}

	function nextRowToKey(row) {
		let key = [];
		for(let pkName in pkNames) {
			key.push(row[pkName]);
		}
		return key;
	}

	c.tryAdd = function(row) {
		let key = rowToKey(row);
		return cache.tryAdd(key, row);
	};

	c.tryRemove = function(row) {
		let key = rowToKey(row);
		cache.tryRemove(key);
	};

	c.subscribeAdded = cache.subscribeAdded;
	c.subscribeRemoved = cache.subscribeRemoved;

	c.getAll = cache.getAll;

	return c;
}

module.exports = newRowCache;