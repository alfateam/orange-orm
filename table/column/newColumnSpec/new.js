var requireMock = require('a_mock').requireMock;
var expectRequire = require('a_mock').expectRequire;
var filter = {};
expectRequire('./filter').return(filter);
var name = {};

function act(c) {
	c.filter = filter;
	c.name = name;	
	c.sut = require('../newColumn')(name);
}

module.exports = act;