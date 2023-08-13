var newSubFilter = require('./subFilter');

function newRelatedColumn(column,relations,isShallow, depth) {
	if (isShallow)
		depth = depth -1 ;
	var c = {};

	var alias = '_' + (depth);
	for (var propName in column) {
		var prop = column[propName];
		if (prop instanceof Function)

			c[propName] = wrapFilter(prop);
	}
	return c;

	function wrapFilter(filter) {
		return runFilter;

		function runFilter() {
			var args = [];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			args.push(alias);
			var shallowFilter =  filter.apply(null,args);
			if (isShallow)
				return shallowFilter;
			return newSubFilter(relations,shallowFilter, depth);
		}
	}

}

module.exports = newRelatedColumn;