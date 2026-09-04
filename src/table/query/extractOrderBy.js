const getSessionSingleton = require('../getSessionSingleton');

function extractOrderBy(context, table, alias, orderBy, originalOrderBy) {
	const quote = getSessionSingleton(context, 'quote');
	alias = quote(alias);
	var dbNames = [];
	var i;
	if (orderBy) {
		if (typeof orderBy === 'string')
			orderBy = [orderBy];
		else if (!Array.isArray(orderBy))
			throwInvalidOrderBy(orderBy);
		if (orderBy.length === 0)
			throwInvalidOrderBy(orderBy);
		for (i = 0; i < orderBy.length; i++) {
			var nameAndDirection = extractNameAndDirection(orderBy[i]);
			pushColumn(nameAndDirection.name, nameAndDirection.direction);
		}
	} else {
		if(originalOrderBy)
			return originalOrderBy;

		for (i = 0; i < table._primaryColumns.length; i++) {
			pushColumn(table._primaryColumns[i].alias);
		}
	}

	function extractNameAndDirection(orderBy) {
		if (typeof orderBy !== 'string')
			throwInvalidOrderBy(orderBy);
		var value = orderBy.trim();
		var match = /^(.*?)(?:\s+(asc|desc))?$/i.exec(value);
		return {
			name: match[1],
			direction: match[2] ? ' ' + match[2].toLowerCase() : ''
		};
	}
	function pushColumn(property, direction) {
		direction = direction || '';
		var result = getTableColumn(property);
		var column = result.column;
		var jsonQuery = result.jsonQuery;

		dbNames.push(alias + '.' + quote(column._dbName) + jsonQuery + direction);
	}

	function getTableColumn(property) {
		var directColumn = table[property];
		if (isColumn(directColumn))
			return { column: directColumn, jsonQuery: '' };

		var operator = /#>>|#>|->>|->/.exec(property);
		var columnName = operator ? property.slice(0, operator.index) : property;
		var column = table[columnName];
		var jsonQuery = operator ? property.slice(operator.index) : '';
		if (!isColumn(column) || !isSafeJsonQuery(jsonQuery))
			throwInvalidOrderBy(property);
		return { column, jsonQuery };
	}

	function isColumn(value) {
		return !!value && typeof value._toFilterArg === 'function';
	}

	function isSafeJsonQuery(value) {
		if (!value)
			return true;
		for (let i = 0; i < value.length; i++) {
			const code = value.charCodeAt(i);
			if (code < 32 || code === 127)
				return false;
		}
		return /^(?:(?:#>>|#>|->>|->)(?:-?[0-9]+|'(?:[^'\\]|'')*'))+$/.test(value);
	}

	function throwInvalidOrderBy(value) {
		const error = new Error(`Unable to get column on orderBy '${String(value)}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
		error.status = 400;
		throw error;
	}

	return ' order by ' + dbNames.join(',');
}

module.exports = extractOrderBy;
