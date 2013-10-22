var manyLegToQuery = _manyLegToQuery;

function addSubQueries(compositeQuery,table,filter,span,alias) {	
	var c = {};
	var _legNo;
	c.visitJoin = function() {};
	c.visitOne = function() {};
	c.visitMany = function(leg) {
		var query = manyLegToQuery(alias,leg,_legNo,filter);
		compositeQuery.add(query);
	};

	span.legs.forEach(onEachLeg);	

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}

	return compositeQuery;
}

function _manyLegToQuery() {
	manyLegToQuery = require('./addSubQueries/manyLegToQuery');	
	return manyLegToQuery.apply(null,arguments);
}


module.exports = addSubQueries;