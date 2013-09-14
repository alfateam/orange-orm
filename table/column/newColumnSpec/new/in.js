var arg = 'arg';
var mock = require('a').mock;

function act(c) {
	c.expected = {};	
	c.in.expect(c.sut,arg,c.alias).return(c.expected);
	c.returned = c.sut.in(arg,c.alias);
}

act.base = '../new';
module.exports = act;