function extract(sql) {
	if (sql && typeof(sql) === 'function')
		return sql();
	else if (sql)
		return sql;
	return '';
}

module.exports = extract;
