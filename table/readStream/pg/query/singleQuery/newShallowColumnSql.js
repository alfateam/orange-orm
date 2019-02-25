var util = require('util');

function _new(table,alias,span) {
	var columnFormat = '%s as "%s"';
	var columns = table._columns;
	var sql = '';
	var separator = alias + '.';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable))
			sql = sql + separator + util.format(columnFormat, column._dbName, column.alias);
		separator = ',' + alias + '.';
	}
	return sql + newJoinedColumnSql(span);


	function newJoinedColumnSql(span) {
		let c = {};
		const result = [];
	
		c.visitJoin = function(leg) {
			result.push(util.format('("%s".coalesce->0) as "%s"', leg.name, leg.name));
		};
		c.visitOne = function(leg) {
			result.push(util.format('("%s".coalesce->0) as "%s"', leg.name, leg.name));
		};
		c.visitMany = function(leg) {
			result.push(util.format('"%s".coalesce as "%s"', leg.name, leg.name));
		};
	
		span.legs.forEach(onEachLeg);	
	
		function onEachLeg(leg,legNo) {
			leg.accept(c);
		}
		if (result.length === 0)
			return '';
		return ',' + result.join(',');
	}
	
}

module.exports = _new;