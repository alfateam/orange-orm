function replaceParamChar(query, params) {
	if (params.length === 0)
		return query.sql();
	var splitted = query.sql().split('?');
	var sql = '';
	var lastIndex = splitted.length - 1;
	for (var i = 0; i < lastIndex; i++) {
		sql += splitted[i] + '@_' + (i + 1);
	}
	sql += splitted[lastIndex];
	return sql;
}

module.exports = replaceParamChar;
