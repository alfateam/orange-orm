var emptyFilter = require('../../emptyFilter');

function extract(filter) {
	if (filter)
		return filter;
	return emptyFilter;
}

module.exports = extract;