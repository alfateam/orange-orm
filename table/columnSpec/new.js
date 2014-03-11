var requireMock = require('a').requireMock;
var newSut = require('../column');
var table = {};
var column = {};

function act(c) {
	c.table = table;
	c.column = column;
	c.sut = newSut(column,table);
}

module.exports = act;