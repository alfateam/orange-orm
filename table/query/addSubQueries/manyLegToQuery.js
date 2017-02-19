var newShallowJoinSql = require('./newShallowJoinSql');
var newQuery = require('../../newQuery');
var newParameterized = require('../newParameterized');
var extractOrderBy = require('../extractOrderBy');

function manyLegToQuery(queries, rightAlias,leg,legNo,filter,innerJoin,limitQuery) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	var orderBy = extractOrderBy(leg.span.table, rightAlias, span.orderBy);
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias,limitQuery);
	innerJoin = shallowJoin.append(innerJoin);	
	return newQuery(queries, span.table,filter,span,leftAlias,innerJoin,orderBy);
}

module.exports = manyLegToQuery;