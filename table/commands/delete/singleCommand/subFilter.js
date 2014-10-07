var newSelect = require('./selectSql');
var newJoin = require('./joinSql');
var newWhere = require('./whereSql');

function newSubFilter(relations, shallowFilter) {
	var relationCount = relations.length;
	var alias = '_' + relationCount;
	var table = relations[0].childTable;
	var filter = newSelect(table,alias).prepend('EXISTS (');
	var join = newJoin(relations);
	var where = newWhere(relations[relationCount-1],shallowFilter);
	return filter.append(join).append(where).append(')');

}

module.exports = newSubFilter;