var emptyFilter = require('../../emptyFilter');

function createBatchFilter(table, filter, strategy, lastDto) {
	if (!lastDto) {
		return filter;
	}

	var orderBy = strategy.orderBy;

	for (var i = 0; i < strategy.orderBy.length; i++) {
		var subFilter = createSubFilter(i);
		filter = filter.or(subFilter);
	}

	function createSubFilter(index) {
		var subFilter = emptyFilter;
		for (var i = 0; i < index + 1; i++) {
			var order = orderBy[i];
			var elements = order.split(' ');
			var name = elements[0];
			var direction = elements[1] || 'asc';
			var value = lastDto[name];
			if (index === i) {
				if (direction === 'asc')
					subFilter = subFilter.and(table[name].greaterThan(value));
				else
					subFilter = subFilter.and(table[name].lessThan(value));
			} else
				subFilter = subFilter.and(table[name].eq(value));
		}
		return subFilter;
	}

	return filter;
}



module.exports = createBatchFilter;
