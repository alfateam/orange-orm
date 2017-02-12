var newJoinCore = require('../singleQuery/joinSql/newShallowJoinSqlCore');
var newParameterized = require('../newParameterized');

function newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias, limitQuery) {	
	var joinCore = newJoinCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var subQuery = negotiateSubQuery();
	var postSql = ' ' +  rightAlias + ' ON (' + joinCore + ')';
	return  subQuery.prepend(' INNER JOIN ').append(postSql);

	function negotiateSubQuery() {
		if (limitQuery) {
			return newParameterized('(').append(limitQuery).append(')');
		}
		return newParameterized(rightTable._dbName);
	}
}

module.exports = newShallowJoinSql;