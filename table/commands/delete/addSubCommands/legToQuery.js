var newShallowJoinSql = require('../../../query/singleQuery/joinSql/newShallowJoinSql');
var newDeleteCommand = require('../../newDeleteCommand');
var newParameterized = require('../../../query/newParameterized');
var emptyFilter;

function manyLegToQuery(queries, rightAlias,leg,legNo,filter, innerJoin) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;	 
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var innerJoin = newParameterized(' INNER' + shallowJoin).append(innerJoin);	
	newDeleteCommand(queries, span.table,filter,span,leftAlias,innerJoin);
}

module.exports = manyLegToQuery;