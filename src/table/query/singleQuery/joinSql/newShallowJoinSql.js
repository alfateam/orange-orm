var newJoinCore = require('./newShallowJoinSqlCore');
const getSessionSingleton = require('../../../getSessionSingleton');

function _new(rightTable,leftColumns,rightColumns,leftAlias,rightAlias, filter) {
	const quote = getSessionSingleton('quote');
	var sql = ' JOIN ' + quote(rightTable._dbName) + ' ' +  quote(rightAlias) + ' ON (';
	var joinCore = newJoinCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias,filter);
	return joinCore.prepend(sql).append(')');
}

module.exports = _new;