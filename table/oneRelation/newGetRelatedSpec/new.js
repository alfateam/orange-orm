var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	c.mock = mock;
	c.then = a.then;	
	c.requireMock = a.requireMock;
	
	c.relation = {};
	c.parent = {};
	c.isDirty = c.requireMock('../isDirty');
	
	c.sut = require('../newGetRelated')(c.parent, c.relation);
}

module.exports = act;