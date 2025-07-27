var newSubFilter = require('./subFilter');
var aggregateGroup = require('./columnAggregateGroup');
var aggregate = require('./columnAggregate');
var childColumn = require('./childColumn');

function newRelatedColumn(column, relations, isShallow, depth) {
	var c = {};

	var alias = 'x' + relations.length;
	for (var propName in column) {
		var prop = column[propName];
		if (prop instanceof Function)

			c[propName] = wrapFilter(prop);
	}

	c.groupSum = (context, ...rest) => aggregateGroup.apply(null, [context, 'sum', column, relations, ...rest]);
	c.groupAvg = (context, ...rest) => aggregateGroup.apply(null, [context, 'avg', column, relations, ...rest]);
	c.groupMin = (context, ...rest) => aggregateGroup.apply(null, [context, 'min', column, relations, false, ...rest]);
	c.groupMax = (context, ...rest) => aggregateGroup.apply(null, [context, 'max', column, relations, false, ...rest]);
	c.groupCount = (context, ...rest) => aggregateGroup.apply(null, [context, 'count', column, relations, false, ...rest]);
	c.sum = (context, ...rest) => aggregate.apply(null, [context, 'sum', column, relations, ...rest]);
	c.avg = (context, ...rest) => aggregate.apply(null, [context, 'avg', column, relations, ...rest]);
	c.min = (context, ...rest) => aggregate.apply(null, [context, 'min', column, relations, false, ...rest]);
	c.max = (context, ...rest) => aggregate.apply(null, [context, 'max', column, relations, false, ...rest]);
	c.count = (context, ...rest) => aggregate.apply(null, [context, 'count', column, relations, false, ...rest]);
	c.self = (context, ...rest) => childColumn.apply(null, [context, column, relations, ...rest]);

	return c;

	function wrapFilter(filter) {
		return runFilter;

		function runFilter(context) {
			var args = [];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			args.push(alias);
			var shallowFilter = filter.apply(null, args);
			if (isShallow)
				return shallowFilter;
			return newSubFilter(context, relations, shallowFilter, depth);
		}
	}

}

module.exports = newRelatedColumn;