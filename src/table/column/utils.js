const newParameterized = require('../query/newParameterized');
const negotiateNextAndFilter = require('./negotiateNextAndFilter');
const negotiateNextOrFilter = require('./negotiateNextOrFilter');

function newBoolean(filter) {
	var c = {};
	c.sql = filter.sql.bind(filter);
	c.parameters = filter.parameters;

	c.append = function(other) {
		var nextFilter = filter.append(other);
		return newBoolean(nextFilter);
	};

	c.prepend = function(other) {
		var nextFilter = filter.prepend(other);
		return newBoolean(nextFilter);
	};

	c.and = function(context, other) {
		other = negotiateRawSqlFilter(context, other);
		var nextFilter = negotiateNextAndFilter(filter, other);
		var next = newBoolean(nextFilter);
		for (var i = 2; i < arguments.length; i++) {
			next = next.and(context, arguments[i]);
		}
		return next;
	};

	c.or = function(context, other) {
		other = negotiateRawSqlFilter(context, other);
		var nextFilter = negotiateNextOrFilter(filter, other);
		var next = newBoolean(nextFilter);
		for (var i = 2; i < arguments.length; i++) {
			next = next.or(context, arguments[i]);
		}
		return next;
	};

	c.not = function(_context) {
		var nextFilter = filter.prepend('NOT (').append(')');
		return newBoolean(nextFilter);
	};

	return c;
}


function negotiateRawSqlFilter(context, filter, optionalTable, emptyArrayMeansFalse) {
	if (Array.isArray(filter) && filter.length === 0) {
		const sql = emptyArrayMeansFalse ? '1 = 2' : '1 = 1';
		return newBoolean(newParameterized(sql));
	}
	else if (Array.isArray(filter)) {
		let curFilter;
		let curObjectFilter;
		for (let i = 0; i < filter.length; i++) {
			let nextFilter = negotiateRawSqlFilter(context,filter[i], optionalTable);
			if (nextFilter.isObjectFilter)
				curObjectFilter = curObjectFilter ? curObjectFilter.or(context, nextFilter) : nextFilter;
			else
				curFilter = curFilter ? curFilter.and(context, nextFilter) : nextFilter;
		}
		if (curFilter && curObjectFilter)
			return curFilter.and(context, curObjectFilter);
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
				return newObjectFilter(context, filter, optionalTable);
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

function newObjectFilter(context, object, table) {
	let primaryColumns = table._primaryColumns;
	let filter;
	for (let i = 0; i < primaryColumns.length; i++) {
		let column = primaryColumns[i];
		let colFilter = column.equal(context, object[column.alias]);
		filter = filter  ? filter.and(context, colFilter) : colFilter ;
	}
	filter.isObjectFilter = true;
	return filter;
}


module.exports = { negotiateRawSqlFilter, newBoolean};