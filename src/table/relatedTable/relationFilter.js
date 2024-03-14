var newSelect = require('./selectSql');
var newJoin = require('./joinSql');
var newWhere = require('./whereSql');

function relationFilter(relations, shallowFilter, depth) {
	var relationCount = relations.length;
	var alias = 'x' + relationCount;
	var table = relations[relationCount-1].childTable;
	var exists = newSelect(table,alias).prepend('EXISTS (');
	var join = newJoin(relations, depth);
	var where = newWhere(relations,shallowFilter, depth);
	return exists.append(join).append(where).append(')');

}

module.exports = relationFilter;