var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;		
	c.then = a.then;
	c.extractStrategy = requireMock('./resultToRows/toDto/extractStrategy');
	c.newToDto = requireMock('./resultToRows/toDto/newToDto');
	c.promise = requireMock('./promise');
	c.resultToPromise = requireMock('./resultToPromise');
	c.empty = c.then();
	c.empty.resolve();
	c.resultToPromise.expect(null).return(c.empty);
	c.promise.all = c.mock();
	c.table = {};

	c.sut = require('../rowArray')(c.table);
}

module.exports = act;