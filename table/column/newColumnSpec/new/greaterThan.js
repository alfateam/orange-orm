var arg = 'arg';
var mock = require('a').mock;

function act(c) {
	c.expected = {};	
	c.greaterThan.expect(c.sut,arg,c.alias).return(c.expected);
	c.returned = c.sut.greaterThan(arg,c.alias);
}

act.base = '../new';
module.exports = act;