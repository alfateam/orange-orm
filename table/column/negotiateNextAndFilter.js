function negotiateNextAndFilter(filter, other) {		
	if (!other.sql())
		return filter;
	return filter.append(' AND ').append(other);
}

module.exports = negotiateNextAndFilter;