var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.emitRemoved = c.mock();
	c.emitRemoved.add = {};
	c.emitAdded = c.mock();
	c.emitAdded.add = {};
	c.newEmitEvent = requireMock('../emitEvent');
	c.newEmitEvent.expect().return(c.emitAdded);
	c.newEmitEvent.expect().return(c.emitRemoved);
	
	c.sut = require('../newCache')();
}

module.exports = act;