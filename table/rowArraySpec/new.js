var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;		
	c.then = a.then;
	c.expectRequire = a.expectRequire;
	c.extractStrategy = requireMock('./resultToRows/toDto/extractStrategy');
	c.newToDto = requireMock('./resultToRows/toDto/newToDto');
	c.promise = requireMock('./promise');
	c.empty = c.then();
	c.empty.resolve();
	c.expectRequire('./nullPromise').return(c.empty);
	
	c.table = {};

	c.sut = require('../rowArray')(c.table);
}

module.exports = act;