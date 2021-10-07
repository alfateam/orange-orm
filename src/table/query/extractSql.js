function extract(sql) {
	if (sql && typeof(sql) === 'function')
		return sql();
	else if (sql === undefined)
		return '';
	else
		return sql;
}

module.exports = extract;
