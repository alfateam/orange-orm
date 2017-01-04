function negotiateNextOrFilter(filter, other) {
	if (!other.sql())
		return filter;
	return filter.prepend('(').append(' OR ').append(other).append(')');
}

module.exports = negotiateNextOrFilter;