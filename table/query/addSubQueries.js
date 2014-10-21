var joinLegToQuery = _joinLegToQuery;
var oneLegToQuery = _oneLegToQuery;
var manyLegToQuery = _manyLegToQuery;

function addSubQueries(queries,table,filter,span,alias,innerJoin) {	
	var c = {};
	var _legNo;

	c.visitJoin = function(leg) {
		joinLegToQuery(queries, alias,leg,_legNo,filter,innerJoin);
	};
	c.visitOne = function(leg) {
		oneLegToQuery(queries, alias,leg,_legNo,filter,innerJoin);
	};
	c.visitMany = function(leg) {
		manyLegToQuery(queries, alias,leg,_legNo,filter,innerJoin);
	};

	span.legs.forEach(onEachLeg);	

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}
}

function _joinLegToQuery() {
	joinLegToQuery = require('./addSubQueries/joinLegToQuery');	
	return joinLegToQuery.apply(null,arguments);
}

function _oneLegToQuery() {
	oneLegToQuery = require('./addSubQueries/oneLegToQuery');	
	return oneLegToQuery.apply(null,arguments);
}

function _manyLegToQuery() {
	manyLegToQuery = require('./addSubQueries/manyLegToQuery');	
	return manyLegToQuery.apply(null,arguments);
}



module.exports = addSubQueries;