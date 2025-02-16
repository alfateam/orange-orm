const newJoinCore = require('./newShallowJoinSqlCore');
const getSessionSingleton = require('../../../getSessionSingleton');

function _new(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter) {
	const quote = getSessionSingleton(context, 'quote');
	const sql = ' JOIN ' + quote(rightTable._dbName) + ' ' + quote(rightAlias) + ' ON (';
	const joinCore = newJoinCore(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter);
	return joinCore.prepend(sql).append(')');
}

module.exports = _new;