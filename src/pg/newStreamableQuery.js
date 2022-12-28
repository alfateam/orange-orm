var QueryStream;

module.exports = function(sql, params) {
	if (!QueryStream)
		QueryStream = require('pg-query-stream');
	return new QueryStream(sql, params);
};