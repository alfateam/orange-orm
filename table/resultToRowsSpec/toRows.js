var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.rows = {};
	c.span = {};
	c.result = {};
	c.table = {};
	c.legs = {};
	c.oneLeg = {};
	c.joinLeg = {};
	c.manyLeg = {};
	c.manyLeg2 = {};
	c.subSpan = 'sub1';
	c.subSpan2 = 'sub2';
	c.span.table = c.table;
	c.span.legs = c.legs;
	c.manyLeg.span = c.subSpan;
	c.manyLeg2.span = c.subSpan2;

	c.dbRowsToRows  = requireMock('./resultToRows/dbRowsToRows');

	c.dbRowsToRows.expect(c.span, c.result).return(c.rows);

	c.result.shift = mock();
	c.result.shift.expect();

	stubLegs();
	
	function onEachLeg(callback) {
		callback(c.oneLeg);
		callback(c.joinLeg);
		callback(c.manyLeg);		
		callback(c.manyLeg2);		
	};

	function stubLegs() {
		c.legs.forEach = mock();
		c.legs.forEach.expectAnything().whenCalled(onEachLeg).return();

		c.joinLeg.accept = mock();
		c.joinLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitJoin(c.joinLeg)});
		c.oneLeg.accept = mock();
		c.oneLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitOne(c.oneLeg)});
		c.manyLeg.accept = mock();
		c.manyLeg.accept.expectAnything().whenCalled(function(visitor) {visitor.visitMany(c.manyLeg)});
		c.manyLeg2.accept = mock();
		c.manyLeg2.accept.expectAnything().whenCalled(function(visitor) {visitor.visitMany(c.manyLeg2)});
	}

	c.sut = require('../resultToRows');
	c.nextResultToRows = requireMock('./resultToRows');
	c.nextResultToRows.expect(c.subSpan, c.result);
	c.nextResultToRows.expect(c.subSpan2, c.result);

	c.returned = c.sut(c.span, c.result);
}

module.exports = act;