var newJoinCore = require('./newShallowJoinSqlCore');

function _new(rightTable,leftColumns,rightColumns,leftAlias,rightAlias, filter) {
	var sql = ' JOIN ' + rightTable._dbName + ' ' +  rightAlias + ' ON (';
	var joinCore = newJoinCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias,filter);
	return joinCore.prepend(sql).append(')');
}

module.exports = _new;