var a = require('a'),
	mock = a.mock,
	requireMock = a.requireMock,
	table = {},
	filter = {},
	span = {},
	alias = 'alias',
	legs = {},
	joinLeg = {},
	manyLeg = {},
	oneLeg = {},
	innerJoin = {},
	query = {};


function act(c) {	
	c.expected = {};
	stubLegs();
	stubSpan();
	c.manyLegToQuery.expect([], alias,oneLeg,0,filter,innerJoin).return(c.expected);	
	c.returned = c.sut(table,filter,span,alias,innerJoin);
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
	callback(joinLeg);
	callback(oneLeg);
	callback(manyLeg);
}

module.exports = act;