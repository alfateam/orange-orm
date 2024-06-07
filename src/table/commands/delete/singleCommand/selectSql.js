var newParameterized = require('../../../query/newParameterized');
var newBoolean = require('../../../column/newBoolean');
const quote = require('../../../quote');

function newSelectSql(table, alias) {
	var colName = quote(table._primaryColumns[0]._dbName);
	alias = quote(alias);
	var sql = 'SELECT ' + alias + '.' + colName + ' FROM ' + quote(table._dbName) + ' ' + alias;
	sql = newParameterized(sql);
	return newBoolean(sql);
}

module.exports = newSelectSql;
