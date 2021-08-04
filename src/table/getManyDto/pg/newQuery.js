var newQueryCore = require('../../readStream/pg/newQueryCore');

function newQuery() {
	var query = newQueryCore.apply(null, arguments);
	return query.prepend('select json_strip_nulls(coalesce(json_agg(row_to_json(r)), \'[]\')) as result from (').append(') r');
}

module.exports = newQuery;