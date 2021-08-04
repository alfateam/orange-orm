var newJoinCore = require('./newShallowJoinSqlCore');

function _new(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) {
	var sql = ' JOIN ' + rightTable._dbName + ' ' +  rightAlias + ' ON (';
	sql += newJoinCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) + ')';
	return sql;
}

module.exports = _new;