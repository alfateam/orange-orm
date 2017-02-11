var a = require('a'),
	mock = a.mock,
	requireMock = a.requireMock,
	queries = {},
	table = {},
	filter = {},
	span = {},
	alias = 'alias',
	legs = {},
	joinLeg = {},
	manyLeg = {},
	oneLeg = {},
	innerJoin = {},
	manyLegQuery = {},
	oneLegQuery = {},
	joinLegQuery = {},
	joinLegNo = {},
	manyLegNo = {},
	oneLegNo = {},
	limitQuery = {};


function act(c) {	
	stubLegs();
	stubSpan();
	c.manyLegToQuery = requireMock('./addSubQueries/manyLegToQuery');
	c.manyLegToQuery.expect(queries, alias,manyLeg,manyLegNo,filter,innerJoin,limitQuery).return(manyLegQuery);

	c.oneLegToQuery = requireMock('./addSubQueries/oneLegToQuery');
	c.oneLegToQuery.expect(queries, alias,oneLeg,oneLegNo,filter,innerJoin,limitQuery).return(oneLegQuery);

	c.joinLegToQuery = requireMock('./addSubQueries/joinLegToQuery');
	c.joinLegToQuery.expect(queries, alias,joinLeg,joinLegNo,filter,innerJoin,limitQuery).return(joinLegQuery);


	c.sut(queries,table,filter,span,alias,innerJoin,limitQuery);
}

function stubLegs() {
	joinLeg.accept = mock();
	joinLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitJoin(joinLeg)});
	oneLeg.accept = mock();
	oneLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitOne(oneLeg)});
	manyLeg.accept = mock();
	manyLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitMany(manyLeg)});
}

function stubSpan() {
	span.legs = legs;
	legs.forEach = mock();
	legs.forEach.expectAnything().whenCalled(onEach); 
}

function onEach(callback) {
	callback(joinLeg,joinLegNo);
	callback(oneLeg,oneLegNo);
	callback(manyLeg,manyLegNo);
}

module.exports = act;