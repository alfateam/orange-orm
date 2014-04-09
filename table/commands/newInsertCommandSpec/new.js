var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.table = {};
	c.row = {};
	c.newInsertCommandCore = requireMock('./newInsertCommandCore');
	c.sut = require('../newInsertCommand')(c.table, c.row);
}

module.exports = act;