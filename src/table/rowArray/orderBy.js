function orderBy(strategy, rows) {
	if (strategy && strategy.orderBy) {
		var comparer = createComparer(strategy.orderBy);
		return rows.sort(comparer);
	}
	return rows;
}

function createComparer(orderBy) {
	var comparers = [];
	if (typeof orderBy === 'string')
		orderBy = [orderBy];
	orderBy.forEach(function(order) {
		var elements = order.split(' ');
		var name = elements[0];
		var direction = elements[1] || 'asc';

		if (direction === 'asc')
			comparers.push(compareAscending);
		else
			comparers.push(compareDescending);

		function compareAscending(a, b) {
			a = a[name];
			b = b[name];
			if (a === b)
				return 0;
			if (a < b)
				return -1;
			return 1;
		}

		function compareDescending(a, b) {
			return compareAscending(b, a);
		}

	});

	function compareComposite(a, b) {
		for (var i = 0; i < comparers.length; i++) {
			var result = comparers[i](a, b);
			if (result !== 0)
				return result;
		}
		return 0;
	}

	return compareComposite;
}

module.exports = orderBy;
