var newSelect = require('./selectSql');
var newJoin = require('./joinSql');
var newWhere = require('./whereSql');

function newSubFilter(relations, shallowFilter, depth) {
	var relationCount = relations.length;
	var alias = '_' + relationCount;
	var table = relations[relationCount-1].childTable;
	var exists = newSelect(table,alias).prepend('EXISTS (');
	var join = newJoin(relations, depth);
	var where = newWhere(relations,shallowFilter, depth);
	return exists.append(join).append(where).append(')');

}

module.exports = newSubFilter;