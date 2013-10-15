var newEmptyFilter = require('./newParameterized');

function extract(filter) {
	if (filter)
		return filter;
	return newEmptyFilter();
}

module.exports = extract;