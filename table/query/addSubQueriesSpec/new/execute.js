var a = require('a'),
	mock = a.mock,
	requireMock = a.requireMock,
	compositeQuery = {},
	table = {},
	filter = {},
	span = {},
	alias = 'alias',
	legs = {},
	joinLeg = {},
	manyLeg = {},
	oneLeg = {},
	manyLegQuery = {},
	joinLegNo = {},
	manyLegNo = {},
	oneLegNo = {};


function act(c) {	
	stubLegs();
	stubSpan();
	c.manyLegToQuery = requireMock('./addSubQueries/manyLegToQuery');
	c.manyLegToQuery.expect(alias,manyLeg,manyLegNo,filter).return(manyLegQuery);
	compositeQuery.add = mock();
	compositeQuery.add.expect(manyLegQuery);
	c.compositeQuery = compositeQuery;
	c.returned = c.sut(compositeQuery,table,filter,span,alias);
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




act.base = '../new';
module.exports = act;