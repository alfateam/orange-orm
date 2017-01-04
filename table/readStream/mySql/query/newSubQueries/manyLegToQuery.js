var newShallowJoinSql = require('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
var extractOrderBy = require('../../../extractOrderBy');
var newQuery = require('./newQueryCore');
var util = require('util');

function manyLegToQuery(rightAlias,leg,legNo) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	var orderBy = extractOrderBy(leftAlias, span);
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var query = newQuery(span.table,span,leftAlias);


	return util.format(",'%s',(select cast(concat('[',ifnull(group_concat(%s%s),''),']') as json) from %s %s where %s)", 
			leg.name, query.sql(), orderBy, span.table._dbName, leftAlias, shallowJoin);
}

module.exports = manyLegToQuery;
