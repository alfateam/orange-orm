var newShallowJoinSql = require('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('./newQueryCore');
var extractOrderBy = require('../../../../query/extractOrderBy');
var util = require('util');

function manyLegToQuery(rightAlias,leg,legNo) {
	var leftAlias = rightAlias + 'x' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	var orderBy = extractOrderBy(rightTable,rightAlias);

	var shallowJoin  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var query = newQuery(span.table,span,leftAlias);


	return util.format(',\'%s\',(select %s from %s %s where %s%s LIMIT 1)',
		leg.name, query.sql(), span.table._dbName, leftAlias, shallowJoin, orderBy);
}

module.exports = manyLegToQuery;
