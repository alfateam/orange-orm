var newJoin = require('./joinSql');
var newWhere = require('./whereSql');
var newParameterized = require('../query/newParameterized');
var quote = require('../quote');

function newFilterArg(context, column, relations, depth = 0) {
	var relationCount = relations.length;
	var alias = 'x' + relationCount;
	var table = relations[relationCount - 1].childTable;

	var quotedAlias = quote(context, alias);
	var quotedColumn = quote(context, column._dbName);
	var quotedTable = quote(context, table._dbName);
	var select = newParameterized(`(SELECT ${quotedAlias}.${quotedColumn} FROM ${quotedTable} ${quotedAlias}`);
	var join = newJoin(context, relations, depth);
	var where = newWhere(context, relations, null, depth);
	return select.append(join).append(where).append(')');
}

module.exports = newFilterArg;
