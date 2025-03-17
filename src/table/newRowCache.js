let newCache = require('./newCache');
let getSessionCache = require('./getSessionCache');
let setSessionCache = require('./setSessionCache');

function newRowCache(table) {
	let id = Symbol();
	let c = {};

	c.tryGet = function(context, row) {
		return getCache(context, table, id).tryGet(row);
	};

	c.tryAdd = function(context, row) {
		return getCache(context, table, id).tryAdd(row);
	};

	c.tryRemove = function(context, row) {
		return getCache(context, table, id).tryRemove(row);
	};

	c.subscribeAdded = function(context, ...rest) {
		return getCache(context, table, id).subscribeAdded.apply(null, rest);
	};

	c.subscribeRemoved = function(context, ...rest) {
		return getCache(context, table, id).subscribeRemoved.apply(null, rest);
	};

	c.getAll = function(context) {
		return getCache(context, table, id).getAll.apply(null, arguments);
	};

	c.getInnerCache = function(context) {
		return getCache(context, table, id);
	};
	return c;
}


function getCache(context, table, id) {
	let cache = getSessionCache(context, id);
	if (cache)
		return cache;
	cache = _newRowCache(table);
	setSessionCache(context, id, cache);
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
		return cache.tryRemove(key);
	};

	c.subscribeAdded = cache.subscribeAdded;
	c.subscribeRemoved = cache.subscribeRemoved;

	c.getAll = cache.getAll;

	return c;
}

module.exports = newRowCache;