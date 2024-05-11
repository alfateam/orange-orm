var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../table/query/singleQuery/newWhereSql');
var newParameterized = require('../../../table/query/newParameterized');

function _new(table, filter, span, alias, subQueries, orderBy, limit, offset) {

	var name = table._dbName;
	var columnSql = newColumnSql(table, alias, span);
	var whereSql = newWhereSql(table, filter, alias);
	if (limit)
		limit = limit + ' ';

	let join = '';
	const set = new Set();
	for(let key in span.aggregates) {
		const agg = span.aggregates[key];
		for(let sql of agg.joins) {
			if (!set.has(sql)) {
				join = join + sql;
				set.add(sql);
			}
		}
	}


	return newParameterized('select ' + limit + columnSql).append(subQueries).append(' from ' + name + ' ' + alias + join).append(whereSql).append(orderBy + offset);
}

module.exports = _new;