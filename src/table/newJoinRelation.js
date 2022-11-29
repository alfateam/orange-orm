var newLeg = require('./relation/newJoinLeg'),
	getById = require('./getById'),
	nullPromise = require('./nullPromise'),
	newGetRelated = require('./newGetRelated'),
	getRelatives = require('./joinRelation/getRelatives'),
	fuzzyPromise = require('./fuzzyPromise');
function _newJoin(parentTable, childTable, columnNames) {
	var c = {};

	c.parentTable = parentTable;
	c.childTable = childTable;
	c.columns = [];
	var columns = parentTable._columns;
	addColumns();

	c.accept = function(visitor) {
		visitor.visitJoin(c);
	};

	c.toLeg = function() {
		return newLeg(c);
	};

	c.getFromDb = function(parent) {
		var key = parentToArrayKey(parent);
		if (key.length === 0) {
			return nullPromise;
		}
		var args = [childTable].concat(key);
		return getById.apply(null, args);
	};

	c.getFromCache = function(parent) {
		var result = c.getRowsSync(parent);
		return fuzzyPromise(result);
	};

	c.toGetRelated = function(parent) {
		return newGetRelated(parent, c);
	};

	c.getRelatives = function(parent) {
		return getRelatives(parent, c);
	};

	c.expand = function(parent) {
		parent.expand(c.leftAlias);
	};

	c.getRowsSync = function(parent) {
		var key = parentToKey(parent);
		let cache = parent._relationCacheMap.get(c);
		return cache.tryGet(key);
	};

	c.getInnerCache = function() {
		return childTable._cache.getInnerCache();
	};

	return c;

	function addColumns() {
		var numberOfColumns = columnNames.length;
		for (var i = 0; i < columns.length; i++) {
			var curColumn = columns[i];
			tryAdd(curColumn);
			if (numberOfColumns === c.columns.length)
				return;
		}
	}

	function tryAdd(column) {
		for (var i = 0; i < columnNames.length; i++) {
			var name = columnNames[i];
			if (column._dbName === name) {
				column.default = undefined;
				c.columns.push(column);
				return;
			}
		}
	}

	function parentToKey(parent) {
		let key = {};
		for (let i = 0; i < c.columns.length; i++) {
			let value = parent[c.columns[i].alias];
			if (value === null || value === undefined)
				return {};
			key[childTable._primaryColumns[i].alias] = value;
		}
		return key;
	}

	function parentToArrayKey(parent) {
		let key = [];
		for (let i = 0; i < c.columns.length; i++) {
			let value = parent[c.columns[i].alias];
			if (value === null || value === undefined)
				return [];
			key.push(value);
		}
		return key;
	}
}

function isNullOrUndefined(item) {
	return item === null || item === undefined;
}

module.exports = _newJoin;
