var manyLegToQuery = _manyLegToQuery;

function addSubQueries(queries,table,filter,span,alias,innerJoin) {	
	var c = {};
	var _legNo;
	c.visitJoin = function() {};
	c.visitOne = function() {};
	c.visitMany = function(leg) {
		manyLegToQuery(queries, alias,leg,_legNo,filter,innerJoin);
	};

	span.legs.forEach(onEachLeg);	

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}
}

function _manyLegToQuery() {
	manyLegToQuery = require('./addSubQueries/manyLegToQuery');	
	return manyLegToQuery.apply(null,arguments);
}


module.exports = addSubQueries;