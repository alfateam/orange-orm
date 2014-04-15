
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.mock = mock;
	c.executeQuery = requireMock('./executeQuery');
	c.newPromise = requireMock('../promise');

	c.sut = require('../executeChanges');
}


module.exports = act;