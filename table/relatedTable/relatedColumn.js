var newSubFilter = require('./subFilter');

function newRelatedColumn(column,relations) {
	var c = {};
	var alias = '_' + relations.length;
	for (var propName in column) {
		var prop = column[propName];
		if (prop instanceof Function)			

			c[propName] = wrapFilter(prop);
	};
	return c;

	function wrapFilter(filter) {
		return runFilter;
		
		function runFilter() {
			var args = [];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			};
			args.push(alias);
			var shallowFilter =  filter.apply(null,args);
			//todo remove: (SELECT primary from _2  JOIN _0.PK = _1.pk JOIN _1.PK = _2.pk  WHERE FILTER)
			return newSubFilter(relations,shallowFilter)
		}
	}

}

module.exports = newRelatedColumn;