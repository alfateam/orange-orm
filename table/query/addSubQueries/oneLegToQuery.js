var newShallowJoinSql = require('./newShallowJoinSql');
var addSubQueries = require('../addSubQueries');
var newParameterized = require('../newParameterized');

var emptyFilter;

function oneLegToQuery(queries, rightAlias,leg,legNo,filter, innerJoin, limitQuery) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;	 
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias,limitQuery);
	innerJoin = shallowJoin.append(innerJoin);	
	return addSubQueries(queries, span.table,filter,span,leftAlias,innerJoin);
}

module.exports = oneLegToQuery;