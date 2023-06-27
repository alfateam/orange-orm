var newQueryCore = require('./newQueryCore');

function newQuery() {
	var query = newQueryCore.apply(null, arguments);
	return query.append(' FOR JSON path, INCLUDE_NULL_VALUES');
}

module.exports = newQuery;