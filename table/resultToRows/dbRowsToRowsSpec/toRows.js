var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.span = {};
    c.joinLeg = {};
	c.oneLeg = {};
	c.manyLeg = {};
    c.joinLeg.accept = mock();
    c.oneLeg.accept = mock();
    c.manyLeg.accept = mock();


    c.joinLeg.accept.expectAnything().whenCalled(visitJoin).repeat(2);
    c.oneLeg.accept.expectAnything().whenCalled(visitOne).repeat(2);
    c.manyLeg.accept.expectAnything().whenCalled(visitMany).repeat(2);

  	function visitJoin(visitor) {
  		visitor.visitJoin();
  	}

  	function visitOne(visitor) {
  		visitor.visitOne();
  	}

  	function visitMany(visitor) {
  		visitor.visitMany(c.manyLeg);
  	}

    c.dbRow1 = {};
    c.dbRow2 = {};
    c.res1 = [c.dbRow1, c.dbRow2];
    c.res2 = {};
    c.result = [c.res1, c.res2];

    c.row1 = {};
    c.row2 = {};
    c.dbRowToRow = requireMock('./dbRowToRow');
    c.dbRowToRow.expect(c.span, c.dbRow1).return(c.row1);
    c.dbRowToRow.expect(c.span, c.dbRow2).return(c.row2);

    c.span.legs = [c.joinLeg, c.oneLeg, c.manyLeg];
    c.manyLeg.expand = mock();
    c.manyLeg.expand.expect(c.row1);
    c.manyLeg.expand.expect(c.row2);


    c.expected = [c.row1, c.row2];

    c.returned = require('../dbRowsToRows')(c.span, c.result);
}

module.exports = act;