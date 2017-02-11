var newShallowJoinSql = require('./newShallowJoinSql');
var addSubQueries = require('../addSubQueries');

function joinLegToQuery(queries, parentAlias,leg,legNo,filter, innerJoin,limitQuery) {	
	var childAlias = parentAlias + '_' + legNo;
	var span = leg.span;
	var parentTable = leg.table;	
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;	 

	var shallowJoin  = newShallowJoinSql(parentTable,childColumns,parentColumns,childAlias,parentAlias,limitQuery);
	innerJoin = shallowJoin.append(innerJoin);	
	return addSubQueries(queries, span.table,filter,span,childAlias,innerJoin);
}

module.exports = joinLegToQuery;