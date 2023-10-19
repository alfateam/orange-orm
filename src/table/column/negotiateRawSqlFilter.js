let newParameterized = function() {
	newParameterized = require('../query/newParameterized');
	return newParameterized.apply(null, arguments);
};

let newBoolean = function() {
	newBoolean = require('./newBoolean');
	return newBoolean.apply(null, arguments);
};

function negotiateRawSqlFilter(filter, optionalTable, emptyArrayMeansFalse) {
	if (Array.isArray(filter) && filter.length === 0) {
		const sql = emptyArrayMeansFalse ? '1 = 2' : '1 = 1';
		return newBoolean(newParameterized(sql));
	}
	else if (Array.isArray(filter)) {
		let curFilter;
		let curObjectFilter;
		for (let i = 0; i < filter.length; i++) {
			let nextFilter = negotiateRawSqlFilter(filter[i], optionalTable);
			if (nextFilter.isObjectFilter)
				curObjectFilter = curObjectFilter ? curObjectFilter.or(nextFilter) : nextFilter;
			else
				curFilter = curFilter ? curFilter.and(nextFilter) : nextFilter;
		}
		if (curFilter && curObjectFilter)
			return curFilter.and(curObjectFilter);
		else if (curFilter)
			return curFilter;
		else
			return curObjectFilter;
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