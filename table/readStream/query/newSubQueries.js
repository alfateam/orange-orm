var joinLegToQuery = _joinLegToQuery;
var oneLegToQuery = _oneLegToQuery;
var manyLegToQuery = _manyLegToQuery;

function newSubQueries(table,span,alias) {
	var result = [];
	var c = {};
	var _legNo;

	c.visitJoin = function(leg) {
		result.push(joinLegToQuery( alias,leg,_legNo));
	};
	c.visitOne = function(leg) {
		result.push(oneLegToQuery( alias,leg,_legNo));
	};
	c.visitMany = function(leg) {
		result.push(manyLegToQuery( alias,leg,_legNo));
	};

	span.legs.forEach(onEachLeg);	

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}

	return result.join('');
}

function _joinLegToQuery() {
	joinLegToQuery = require('./newSubQueries/joinLegToQuery');	
	return joinLegToQuery.apply(null,arguments);
}

function _oneLegToQuery() {
	oneLegToQuery = require('./newSubQueries/oneLegToQuery');	
	return oneLegToQuery.apply(null,arguments);
}

function _manyLegToQuery() {
	manyLegToQuery = require('./newSubQueries/manyLegToQuery');	
	return manyLegToQuery.apply(null,arguments);
}



module.exports = newSubQueries;