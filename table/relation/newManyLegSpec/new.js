var a = require('a');
var requireMock = a.requireMock;
var relation = {};
var leg = {};
var newLeg;

function act(c){
	
	newLeg = requireMock('./newOneLeg');
	newLeg.expect(relation).return(leg);
	c.leg = leg;
	c.mock = a.mock;
	c.sut = require('../newManyLeg')(relation);
}

module.exports = act;