var newSelect = require('./selectSql');
var newJoin = require('./joinSql');
var newWhere = require('./whereSql');
var createAlias = require('../createAlias');
function newSubFilter(relations, shallowFilter) {
	var relationCount = relations.length;
	if (relationCount === 0)
		return shallowFilter;
	var table = relations[0].childTable;
	var alias = createAlias(table, relationCount -1);
	var filter = newSelect(table,alias).prepend('EXISTS (');
	var join = newJoin(relations.slice(1));
	var where = newWhere(relations,shallowFilter,alias);
	return filter.append(join).append(where).append(')');

}

module.exports = newSubFilter;