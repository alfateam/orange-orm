var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.domain = {};
	process.domain = c.domain;

	c.sut = require('../releaseDbClient');
}

module.exports = act;