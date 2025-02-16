var newSelect = require('./selectSql');
var newJoin = require('./joinSql');
var newWhere = require('./whereSql');

function newSubFilter(context, relations, shallowFilter, depth) {
	var relationCount = relations.length;
	var alias = 'x' + relationCount;
	var table = relations[relationCount-1].childTable;
	var exists = newSelect(context, table,alias).prepend('EXISTS (');
	var join = newJoin(context, relations, depth);
	var where = newWhere(context, relations,shallowFilter, depth);
	return exists.append(join).append(where).append(')');

}

module.exports = newSubFilter;