var newRelatedColumn = require('./relatedTable/relatedColumn');
var nextRelatedTable = _nextRelatedTable;
var subFilter = require('./relatedTable/subFilter');
var any = require('./relatedTable/any');
var all = require('./relatedTable/all');
var none = require('./relatedTable/none');

function newRelatedTable(relations, isShallow) {
	var table = relations[relations.length - 1].childTable;
	var columns = table._columns;
	var c = {};

	c.any = any(relations);
	c.all = all(relations);
	c.none = none(relations);

	Object.defineProperty(c, '_shallow', {
		get: function() {
			return newRelatedTable(relations, true) ;
		}
	});

	Object.defineProperty(c, '_relation', {
		value: relations[relations.length - 1],
		writable: false
	});

	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		c[col.alias] = newRelatedColumn(col, relations, isShallow);
	}
	defineChildren();

	function defineChildren() {
		var childRelations = table._relations;
		for (var alias in childRelations) {
			defineChild(alias);
		}
	}

	function defineChild(alias) {
		var relation = table._relations[alias];
		var children = relations.slice(0);
		children.push(relation);

		Object.defineProperty(c, alias, {
			get: function() {
				return nextRelatedTable(children, isShallow) ;
			}
		});
	}

	c.exists = function() {
		if (isShallow)
			return '';
		return subFilter(relations, isShallow);
	};

	return c;
}

function _nextRelatedTable(relations, isShallow) {
	nextRelatedTable = require('./newRelatedTable');
	return nextRelatedTable(relations, isShallow);
}

module.exports = newRelatedTable;