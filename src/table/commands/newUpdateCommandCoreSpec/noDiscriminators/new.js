var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.table._columnDiscriminators = [];
	
	c.expected = c.part8;
	c.returned = c.sut(c.table, c.columnList, c.row);
}

module.exports = act;