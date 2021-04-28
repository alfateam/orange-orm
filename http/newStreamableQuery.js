var QueryStream = require('pg-query-stream');

module.exports = function(sql, params) {
	return new QueryStream(sql, params);
};