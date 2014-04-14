var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.stubCommand();
	c.returned = c.sut.sql();
}

module.exports = act;