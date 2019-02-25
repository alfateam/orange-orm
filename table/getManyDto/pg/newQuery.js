var newQueryCore = require('../readStream/pg/newQueryCore');

function newQuery(table,filter,span,alias) {	
	var query = newQueryCore.apply(null, arguments);
	return query.prepend("select coalesce(array_to_json(array_agg(row_to_json(r))),'[]') from (").append(") r");
}

module.exports = newQuery;