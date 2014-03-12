var a = require('a');
var mock = a.mock;

function act(c){
	c.mock = mock;	
	c.filter = {};

	c.sut = require('../newBoolean')(c.filter);
}

module.exports = act;