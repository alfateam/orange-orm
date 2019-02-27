var newShallowJoinSql = require('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');
var newParameterized = require('../../../../query/newParameterized');
var extractOrderBy = require('../../../../query/extractOrderBy');
var util = require('util');

function manyLegToQuery(rightAlias,leg,legNo) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	var orderBy = extractOrderBy(rightTable,rightAlias);
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
 	var filter = newParameterized(shallowJoin);
	var query = newQuery(span.table,filter,span,leftAlias,orderBy);
	return util.format(',(select coalesce(json_agg(row_to_json(r)),\'[]\') from (%s) r ) "%s"', query.sql(), leg.name );

}

module.exports = manyLegToQuery;