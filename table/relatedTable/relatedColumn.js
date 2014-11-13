var newSubFilter = require('./subFilter');

function newRelatedColumn(column,relations) {
	var c = {};
	var alias = '_' + relations.length;
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
			return newSubFilter(relations,shallowFilter);
		}
	}

}

module.exports = newRelatedColumn;