var newShallowJoinSql = require('../singleQuery/joinSql/newShallowJoinSql');
var newQuery = require('../../newQuery');
var emptyFilter;

function manyLegToQuery(rightAlias,leg,legNo,innerJoin) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;	 
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	innerJoin = innerJoin.prepend(' INNER' + shallowJoin);	
	return newQuery(span.table,emptyFilter,span,leftAlias,innerJoin);
}

module.exports = manyLegToQuery;