var newSelect = require('./selectSql');
var newJoin = require('./joinSql');
var newWhere = require('./whereSql');

function newSubFilter(relations, shallowFilter) {
	if (relations.length == 0)
		return shallowFilter;
	var relationCount = relations.length;
	var alias = '_' + (relationCount -1);
	var table = relations[0].childTable;
	var filter = newSelect(table,alias).prepend('EXISTS (');
	var join = newJoin(relations.slice(1));
	var where = newWhere(relations,shallowFilter);
	return filter.append(join).append(where).append(')');

}

module.exports = newSubFilter;