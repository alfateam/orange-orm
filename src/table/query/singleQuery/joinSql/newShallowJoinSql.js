const newJoinCore = require('./newShallowJoinSqlCore');
const getSessionSingleton = require('../../../getSessionSingleton');
const lockSql = require('../lockSql');

function _new(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter, span) {
	const quote = getSessionSingleton(context, 'quote');
	const tableHint = lockSql.tableHintSql(context, span);
	const sql = ' JOIN ' + quote(rightTable._dbName) + ' ' + quote(rightAlias) + tableHint + ' ON (';
	const joinCore = newJoinCore(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter);
	return joinCore.prepend(sql).append(')');
}

module.exports = _new;
