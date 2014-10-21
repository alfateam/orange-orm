var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.expected = {};

	c.legToQuery = c.requireMock('./joinLegToQuery');	
	c.getRelativesCore = c.requireMock('../getRelativesCore');

	c.getRelativesCore.bind = c.mock();
	c.getRelativesCore.bind.expect(null, c.legToQuery).return(c.expected);	

	c.sut = require('../getRelatives');	
}

module.exports = act;