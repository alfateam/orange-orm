var joinLegToQuery = _joinLegToQuery;
var oneLegToQuery = _oneLegToQuery;
var manyLegToQuery = _manyLegToQuery;
var newParameterized = require('../../../table/query/newParameterized');

function newSubQueries(_table,span,alias) {
	var result = newParameterized('', []);
	var c = {};
	var _legNo;

	c.visitJoin = function(leg) {
		result = result.append(',').append(joinLegToQuery( alias,leg,_legNo));
	};
	c.visitOne = function(leg) {
		result = result.append(',').append(oneLegToQuery( alias,leg,_legNo));
	};
	c.visitMany = function(leg) {
		result = result.append(',').append(manyLegToQuery( alias,leg,_legNo));
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}

	return result;
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