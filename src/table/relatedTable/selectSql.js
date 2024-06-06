var newParameterized = require('../query/newParameterized');
var newBoolean = require('../column/newBoolean');
var quote = require('../quote');

function newSelectSql(table, alias) {
	const quotedAlias  = quote(alias);
	const colName = table._primaryColumns[0]._dbName;
	const sql = 'SELECT ' + quotedAlias + '.' + colName + ' FROM ' + quote(table._dbName) + ' ' + quotedAlias;
	const sqlp = newParameterized(sql);
	return newBoolean(sqlp);
}

module.exports = newSelectSql;
