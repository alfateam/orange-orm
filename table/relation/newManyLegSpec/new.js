var a = require('a');
var requireMock = a.requireMock;

var leg = {};
var newLeg;

function act(c){
	c.relation = {};
	c.joinRelation = {};
	c.relation.joinRelation = c.joinRelation;
	c.joinRelation.rightAlias = {};	
	newLeg = requireMock('./newOneLeg');
	newLeg.expect(c.relation).return(leg);
	c.leg = leg;
	c.mock = a.mock;
	c.sut = require('../newManyLeg')(c.relation);
}

module.exports = act;