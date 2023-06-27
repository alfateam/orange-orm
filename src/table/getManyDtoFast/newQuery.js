var newQueryCore = require('./newQueryCore');

function newQuery() {
	var query = newQueryCore.apply(null, arguments);
	return query;
}

module.exports = newQuery;