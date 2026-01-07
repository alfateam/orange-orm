function negotiateNullParams(query) {
	if (query && query.parameters && query.parameters.length > 0 && (query.parameters.filter(x => x === null || x === undefined).length > 0)) {
		var splitted = query.sql().split('?');
		var sql = '';
		var parameters = [];
		var lastIndex = splitted.length - 1;
		for (var i = 0; i < lastIndex; i++) {
			if (query.parameters[i] === null || query.parameters[i] === undefined)
				sql += splitted[i] + 'null';
			else {
				sql += splitted[i] + '?';
				parameters.push(query.parameters[i]);
			}
		}
		sql += splitted[lastIndex];
		return {
			sql: () => sql,
			parameters
		};

	}
	else
		return query;
}

module.exports = negotiateNullParams;