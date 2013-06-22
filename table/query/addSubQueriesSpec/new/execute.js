var mock = require('a_mock').mock,
	compositeQuery = {},
	table = {},
	filter = {},
	span = {},
	alias = 'alias',
	legs = {},
	joinLeg = {},
	manyLeg = {},
	oneLeg = {},
	manyLegQuery = {};

function act(c) {
	stubLegs();
	stubSpan();
	c.manyLegToQuery.expect(alias,manyLeg,filter).return(manyLegQuery);
	compositeQuery.add = mock();
	compositeQuery.add.expect(manyLegQuery);
	c.compositeQuery = compositeQuery;
	c.returned = c.sut(compositeQuery,table,filter,span,alias);
}

function stubLegs() {
	joinLeg.accept = mock();
	joinLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitJoinLeg(joinLeg)});
	oneLeg.accept = mock();
	oneLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitOneLeg(oneLeg)});
	manyLeg.accept = mock();
	manyLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitManyLeg(manyLeg)});
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