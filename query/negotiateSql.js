function negotiateSql(sql) {
	if(typeof(sql) === 'function')
		return sql;
	else if(typeof(sql) === 'string')
		return function() { return sql; };
	else
		throw new Error('Query lacks sql property string or function');
}

module.exports = negotiateSql;