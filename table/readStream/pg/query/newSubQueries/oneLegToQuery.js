var newShallowJoinSql = require('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');
var newParameterized = require('../../../../query/newParameterized');
var util = require('util');

function oneLegToQuery(rightAlias,leg,legNo) {	
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;	 
	 
	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var filter = newParameterized(shallowJoin);
	var query = newQuery(span.table,filter,span,leftAlias);
	return util.format(',(select row_to_json(r) from (%s limit 1) r) "%s"', query.sql(), leg.name );
}

module.exports = oneLegToQuery;