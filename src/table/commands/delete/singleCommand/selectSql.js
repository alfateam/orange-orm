const newParameterized = require('../../../query/newParameterized');
const newBoolean = require('../../../column/newBoolean');
const quote = require('../../../quote');

function newSelectSql(context, table, alias) {
	const colName = quote(context, table._primaryColumns[0]._dbName);
	alias = quote(context, alias);
	let sql = 'SELECT ' + alias + '.' + colName + ' FROM ' + quote(context, table._dbName) + ' ' + alias;
	sql = newParameterized(sql);
	return newBoolean(sql);
}

module.exports = newSelectSql;
