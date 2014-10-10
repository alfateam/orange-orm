var newParameterized = require('../../../query/newParameterized');
var newBoolean = require('../../../column/newBoolean');

function newSelectSql(table, alias) {
	var colName = table._primaryColumns[0]._dbName;
	var sql = 'SELECT ' + alias + '.' + colName + ' FROM ' + table._dbName + ' AS ' + alias;
	sql = newParameterized(sql);
	return newBoolean(sql);
}

module.exports = newSelectSql;
