var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;
	c.pg = requireMock('pg.js');
	c.pg.connect = mock();

	c.connectionString = {};
	c.domain = {};

	c.sut = require('../newTransaction')(c.domain, c.connectionString);
}

module.exports = act;