var newParameterized = require('../query/newParameterized');
var newBoolean = require('../column/newBoolean');
const getSessionSingleton = require('../getSessionSingleton');

function newSelectSql(context, table, alias) {
	const quote = getSessionSingleton(context, 'quote');
	const quotedAlias  = quote(alias);
	const colName = quote(table._primaryColumns[0]._dbName);
	const sql = 'SELECT ' + quotedAlias + '.' + colName + ' FROM ' + quote(table._dbName) + ' ' + quotedAlias;
	const sqlp = newParameterized(sql);
	return newBoolean(sqlp);
}

module.exports = newSelectSql;
