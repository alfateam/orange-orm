var newRelatedColumn = require('./relatedTable/relatedColumn');
var nextRelatedTable = _nextRelatedTable;
var subFilter = require('./relatedTable/subFilter');
var any = require('./relatedTable/any');
var all = require('./relatedTable/all');
var where = require('./relatedTable/where');
var aggregate = require('./relatedTable/aggregate');
var none = require('./relatedTable/none');

function newRelatedTable(relations, isShallow, depth = 0) {
	var table = relations[relations.length - 1].childTable;
	var columns = table._columns;

	let c;
	// if (isShallow)
	// 	c = any(relations.slice(-1), depth);
	// else
	c = any(relations, depth);
	// @ts-ignore
	c.all = all(relations, depth);
	// @ts-ignore
	c.any = c;

	// @ts-ignore
	c.none = none(relations, depth);

	// @ts-ignore
	c.where =  where(relations, depth);

	// @ts-ignore
	c._aggregate = aggregate(relations);

	Object.defineProperty(c, '_relation', {
		value: relations[relations.length - 1],
		writable: false
	});

	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		if (col.alias === 'name')
			c._name = newRelatedColumn(col, relations, isShallow, depth);
		else
			c[col.alias] = newRelatedColumn(col, relations, isShallow, depth);
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
				return nextRelatedTable(children, false, depth);
			}
		});
	}


	// @ts-ignore
	c.exists = function() {
		if (isShallow)
			return '';
		return subFilter(relations, false, depth);
	};

	let cProxy = new Proxy(c, {
		get: function(target, prop) {
			if (prop === 'name') {
				return target._name !== undefined ? target._name : target.name;
			}
			return target[prop];
		},
		set: function(target, prop, value) {
			if (prop === 'name') {
				target._name = value;
			} else {
				target[prop] = value;
			}
			return true;
		}
	});

	return cProxy;
}

function _nextRelatedTable(relations, isShallow, depth) {
	nextRelatedTable = require('./newRelatedTable');
	return nextRelatedTable(relations, isShallow, depth);
}

module.exports = newRelatedTable;