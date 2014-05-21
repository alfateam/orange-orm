var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;		
	c.extractStrategy = requireMock('./resultToRows/toDto/extractStrategy');
	c.newToDto = requireMock('./resultToRows/toDto/newToDto');
	c.promise = requireMock('./promise');
	c.promise.all = c.mock();
	c.table = {};

	c.sut = require('../rowArray')(c.table);
}

module.exports = act;