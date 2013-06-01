var requireMock = require('a_mock').requireMock;
var equal = requireMock('./equal');
var notEqual = requireMock('./notEqual');
var lessThan = requireMock('./lessThan');
var lessThanOrEqual = requireMock('./lessThanOrEqual');
var greaterThan = requireMock('./greaterThan');
var greaterThanOrEqual = requireMock('./greaterThanOrEqual');
var _in = requireMock('./in');
var contains = requireMock('./contains');
var startsWith = requireMock('./startsWith');
var endsWith = requireMock('./endsWith');
var name = {};
var table = {};
var columns = [];
table.columns = columns;

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
	c.contains = contains;
	c.startsWith = startsWith;
	c.endsWith = endsWith;
	c.name = name;	
	c.sut = require('../newColumn')(table,name);
}

module.exports = act;