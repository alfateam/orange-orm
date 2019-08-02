var newLeg = require('./relation/newJoinLeg'),
	getById = require('./getById'),
	nullPromise = require('./nullPromise'),
	newGetRelated = require('./newGetRelated'),
	getRelatives = require('./joinRelation/getRelatives'),
	tryGetFromCacheById = require('./tryGetFromCacheById');

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
		var key = parentToKey(parent);
		if (key.some(isNullOrUndefined)) {
			return nullPromise;
		}
		var args = [childTable].concat(key);
		return getById.apply(null, args);
	};

	c.getFromCache = c.getFromDb;

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

		if (key.some(isNullOrUndefined)) {
			return null;
		}
		var args = [childTable].concat(key);
		return tryGetFromCacheById.apply(null, args);
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
				c.columns.push(column);
				return;
			}
		}
	}

	function isNullOrUndefined(item) {
		return item === null || item === undefined;
	}

	function parentToKey(parent) {
		var primaryKeys = c.columns.map(function(column) {
			return parent[column.alias];
		});
		return primaryKeys;
	}
}

module.exports = _newJoin;
