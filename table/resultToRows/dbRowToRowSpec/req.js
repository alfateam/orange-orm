var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;
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
	c.row = {};
	c.initialRow = {};

	c.decodeDbRow = requireMock('./decodeDbRow');
	c.decoded = {};
	c.decodeDbRow.expect(c.table, c.dbRow).return(c.decoded);

	c.shallowDbRowToRow = requireMock('./shallowDbRowToRow');
	c.shallowDbRowToRow.expect(c.table, c.decoded).return(c.initialRow);
	c.cache.tryAdd = mock();

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
	c.oneLeg.expand.expect(c.row);
	
	c.joinLeg.accept = mock();
	c.joinLeg.accept.expectAnything().whenCalled(function(visitor) { visitor.visitJoin(c.joinLeg); }).return();

	c.manyLeg.accept = mock();
	c.manyLeg.accept.expectAnything().whenCalled(function(visitor) { visitor.visitMany(c.manyLeg); }).return();
	c.manyLeg.expand = mock();
	c.manyLeg.expand.expect(c.row);


	c.sut = require('../dbRowToRow');

	c.nextDbRowToRow = requireMock('./dbRowToRow');
	c.nextDbRowToRow.expect(c.oneLegSpan, c.dbRow);
	c.nextDbRowToRow.expect(c.joinLegSpan, c.dbRow);

}

module.exports = act;