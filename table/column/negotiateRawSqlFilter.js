let newParameterized = function() {
	newParameterized = require('../query/newParameterized');
	return newParameterized.apply(null, arguments);
};

let newBoolean = function() {
	newBoolean = require('./newBoolean');
	return newBoolean.apply(null, arguments);
};

function negotiateRawSqlFilter(filter, optionalTable) {
	if (Array.isArray(filter) && filter.length === 0)
		return newBoolean(newParameterized());
	else if (Array.isArray(filter)) {
		let curFilter;
		for (let i = 0; i < filter.length; i++) {
			let nextFilter = negotiateRawSqlFilter(filter[i], optionalTable);
			if (nextFilter.isObjectFilter)
				curFilter = curFilter ? curFilter.or(nextFilter) : nextFilter;
			else
				curFilter = curFilter ? curFilter.and(nextFilter) : nextFilter;
		}
		return curFilter;
	}
	else {
		let params = [];
		if (filter) {
			if (filter.and)
				return filter;
			if (filter.sql) {
				let sql = filter.sql;
				if (typeof filter.sql === 'function') {
					sql = filter.sql();
				}
				params.push(sql, filter.parameters);
			}
			else if (isObjectFilter(filter, optionalTable))
				return newObjectFilter(filter, optionalTable);
			else
				params = [filter];
		} else {
			params = [filter];
		}

		let parameterized = newParameterized.apply(null, params);
		return newBoolean(parameterized);
	}
}

function isObjectFilter(object, optionalTable) {
	return optionalTable && object;
}

function newObjectFilter(object, table) {
	let primaryColumns = table._primaryColumns;
	let filter;
	for (let i = 0; i < primaryColumns.length; i++) {
		let column = primaryColumns[i];
		let colFilter = column.equal(object[column.alias]);
		filter = filter  ? filter.and(colFilter) : colFilter ;
	}
	filter.isObjectFilter = true;
	return filter;
}

module.exports = negotiateRawSqlFilter;