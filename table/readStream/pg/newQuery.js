var newQueryCore = require('./newQueryCore');

function newQuery(table,filter,span,alias,orderBy) {	
	var query = newQueryCore.apply(null, arguments);
	return query.prepend('select row_to_json(r)::text as result from (').append(') r');
}

module.exports = newQuery;