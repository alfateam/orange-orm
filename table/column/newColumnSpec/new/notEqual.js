var arg = 'arg';
var mock = require('a_mock').mock;

function act(c) {
	c.expected = {};	
	c.notEqual.expect(c.sut,arg,c.alias).return(c.expected);
	c.returned = c.sut.notEqual(arg,c.alias);
}

act.base = '../new';
module.exports = act;