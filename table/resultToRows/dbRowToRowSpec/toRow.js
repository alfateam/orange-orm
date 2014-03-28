var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.span = {};
	c.dbRow = {};
	c.table = {};
	c.cache = {};
	c.table._cache = c.cache;
	c.oneLeg = {};
	c.oneLegSpan = {};
	c.oneLeg.span = c.oneLegSpan;
	c.joinLeg = {};
	c.joinLegSpan = {};
	c.joinLeg.span = c.joinLegSpan;
	c.manyLeg = {};
	c.legs = {};
	c.span.table = c.table;
	c.span.legs = c.legs;
	c.expected = {};

	c.shallowDbRowToRow = requireMock('./shallowDbRowToRow');
	c.shallowDbRowToRow.expect(c.table, c.dbRow).return(c.expected);
	c.cache.tryAdd = mock();
	c.cache.tryAdd.expect(c.expected);

	c.legs.forEach = mock();
	c.legs.forEach.expectAnything().whenCalled(onEach).return();
	
	function onEach (callback) {
		callback(c.oneLeg);
		callback(c.joinLeg);
		callback(c.manyLeg);
	}

	c.oneLeg.accept = mock();
	c.oneLeg.expand = mock();
	c.oneLeg.accept.expectAnything().whenCalled(function(visitor) { visitor.visitOne(c.oneLeg); }).return();
	c.oneLeg.expand.expect(c.expected);
	
	c.joinLeg.accept = mock();
	c.joinLeg.expand = mock();
	c.joinLeg.accept.expectAnything().whenCalled(function(visitor) { visitor.visitJoin(c.joinLeg); }).return();
	c.joinLeg.expand.expect(c.expected);

	c.manyLeg.accept = mock();
	c.manyLeg.accept.expectAnything().whenCalled(function(visitor) { visitor.visitMany(c.manyLeg); }).return();

	c.sut = require('../dbRowToRow');

	c.nextDbRowToRow = requireMock('./dbRowToRow');
	c.nextDbRowToRow.expect(c.oneLegSpan, c.dbRow);
	c.nextDbRowToRow.expect(c.joinLegSpan, c.dbRow);

	c.returned = c.sut(c.span, c.dbRow);
}

module.exports = act;