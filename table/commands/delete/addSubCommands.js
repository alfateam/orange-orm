var legToQuery = _manyLegToQuery;

function addSubQueries(queries,table,filter,span,alias,innerJoin) {	
	var c = {};
	var _legNo;
	c.visitJoin = function() {};	
	c.visitMany = function(leg) {
		legToQuery(queries, alias,leg,_legNo,filter,innerJoin);
	};
	c.visitOne = c.visitMany;

	span.legs.forEach(onEachLeg);	

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}
}

function _manyLegToQuery() {
	legToQuery = require('./addSubCommands/legToQuery');	
	return legToQuery.apply(null,arguments);
}


module.exports = addSubQueries;