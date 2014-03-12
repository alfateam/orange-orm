var requireMock = require('a').requireMock;
var equal = requireMock('./equal');
var notEqual = requireMock('./notEqual');
var lessThan = requireMock('./lessThan');
var lessThanOrEqual = requireMock('./lessThanOrEqual');
var greaterThan = requireMock('./greaterThan');
var greaterThanOrEqual = requireMock('./greaterThanOrEqual');
var _in = requireMock('./in');
var name = 'columnName';
var table = {};
var columns = [];
table._columns = columns;

function act(c) {
	c.columns = columns;
	c.equal = equal;
	c.alias = {};
	c.notEqual = notEqual;
	c.lessThan = lessThan;
	c.lessThanOrEqual = lessThanOrEqual;
	c.greaterThan = greaterThan;
	c.greaterThanOrEqual = greaterThanOrEqual;
	c.in = _in;
	c.name = name;	
	c.table = table;
	c.sut = require('../newColumn')(table,name);
}

module.exports = act;