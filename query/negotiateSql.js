function negotiateSql(query) {
	if(typeof(query) === 'string')
		return function() { return query; };

	var sql = query.sql;
	if(typeof(sql) === 'function')
		return sql;
	else if(typeof(sql) === 'string')
		return function() { return sql; };
	else
		throw new Error('Query lacks sql property string or function');
}

module.exports = negotiateSql;