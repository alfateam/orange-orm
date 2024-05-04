var newSubFilter = require('./subFilter');
var aggregate = require('./columnAggregate');

function newRelatedColumn(column, relations, isShallow, depth) {
	var c = {};

	var alias = 'x' + relations.length;
	for (var propName in column) {
		var prop = column[propName];
		if (prop instanceof Function)

			c[propName] = wrapFilter(prop);
	}

	c.sum = aggregate.bind(null, 'sum', column, relations);
	c.avg = aggregate.bind(null, 'avg', column, relations);
	c.min = aggregate.bind(null, 'min', column, relations);
	c.max = aggregate.bind(null, 'max', column, relations);
	c.count = aggregate.bind(null, 'count', column, relations);

	return c;

	function wrapFilter(filter) {
		return runFilter;

		function runFilter() {
			var args = [];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			args.push(alias);
			var shallowFilter = filter.apply(null, args);
			if (isShallow)
				return shallowFilter;
			return newSubFilter(relations, shallowFilter, depth);
		}
	}

}

module.exports = newRelatedColumn;