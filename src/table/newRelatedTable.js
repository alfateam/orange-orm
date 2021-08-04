var newRelatedColumn = require('./relatedTable/relatedColumn');
var nextRelatedTable = _nextRelatedTable;
var subFilter = require('./relatedTable/subFilter');

function newRelatedTable(relations) {
	var table = relations[relations.length - 1].childTable;
	var columns = table._columns;
	var c = {};

	Object.defineProperty(c, '_relation', {
		value: relations[relations.length - 1],
		writable: false
	});

	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		c[col.alias] = newRelatedColumn(col, relations);
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
				return nextRelatedTable(children);
			}
		});
	}

	c.exists = function() {
		return subFilter(relations);
	};

	return c;
}

function _nextRelatedTable(relations) {
	nextRelatedTable = require('./newRelatedTable');
	return nextRelatedTable(relations);
}

module.exports = newRelatedTable;