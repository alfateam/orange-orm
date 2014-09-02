var manyLegToQuery = require('./query/addSubQueries/manyLegToQuery');

function newRelativeQuery(table,filter,span,alias,innerJoin) {	
	var c = {};
	var legNo = 0;
	var queries = [];
	c.visitJoin = function() {};
	c.visitOne = function(leg) {
		queries = manyLegToQuery(queries,alias,leg,legNo,filter,innerJoin);
	};
	c.visitMany = function(leg) {
	};

	span.legs.forEach(onEachLeg);	
	return queries;

	function onEachLeg(leg) {
		leg.accept(c);
	}
}

module.exports = newRelativeQuery;