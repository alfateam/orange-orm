var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.tryGetByIdSync = requireMock('../tryGetByIdSync');
	c.mock = mock;		
	c.sut = require('../getRelatedRows');
}

module.exports = act;