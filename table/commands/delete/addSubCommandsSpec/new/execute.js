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
	joinLegNo = {},
	manyLegNo = {},
	oneLegNo = {};


function act(c) {	
	stubLegs();
	stubSpan();
	c.legToQuery = requireMock('./addSubCommands/legToQuery');
	c.legToQuery.expect(queries, alias,manyLeg,manyLegNo,filter,innerJoin).return(manyLegQuery);
	c.legToQuery.expect(queries, alias,oneLeg,oneLegNo,filter,innerJoin).return(oneLegQuery);
	c.sut(queries,table,filter,span,alias,innerJoin);
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

function onOneLeg(callback) {
	callback(oneLeg);
}

function onManyLeg(callback) {
	callback(manyLeg);
}

function onJoinLeg(callback) {
	callback(joinLeg);
}

module.exports = act;