const newSelect = require('./selectSql');
const newJoin = require('./joinSql');
const newWhere = require('./whereSql');
const createAlias = require('../createAlias');

function newSubFilter(context,relations, shallowFilter) {
	const relationCount = relations.length;
	if (relationCount === 0)
		return shallowFilter;
	const table = relations[0].childTable;
	const alias = createAlias(table, relationCount -1);
	const filter = newSelect(context,table,alias).prepend('EXISTS (');
	const join = newJoin(context, relations.slice(1));
	const where = newWhere(context,relations,shallowFilter,alias);
	return filter.append(join).append(where).append(')');

}

module.exports = newSubFilter;