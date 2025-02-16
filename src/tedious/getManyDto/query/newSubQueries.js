const newParameterized = require('../../../table/query/newParameterized');
const joinLegToQuery = require('./newSubQueries/joinLegToQuery');
const oneLegToQuery = require('./newSubQueries/oneLegToQuery');
const manyLegToQuery = require('./newSubQueries/manyLegToQuery');

function newSubQueries(newQuery, context, _table, span, alias) {
	var result = newParameterized('', []);
	var c = {};
	var _legNo;

	c.visitJoin = function(leg) {
		result = result.append(',').append(joinLegToQuery(newQuery, context, alias, leg, _legNo));
	};
	c.visitOne = function(leg) {
		result = result.append(',').append(oneLegToQuery(newQuery, context, alias, leg, _legNo));
	};
	c.visitMany = function(leg) {
		result = result.append(',').append(manyLegToQuery(newQuery, context, alias, leg, _legNo));
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg, legNo) {
		_legNo = legNo;
		leg.accept(c);
	}

	return result;
}

module.exports = newSubQueries;