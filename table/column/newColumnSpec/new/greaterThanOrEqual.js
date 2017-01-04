var arg = 'arg';
var mock = require('a').mock;

function act(c) {
	c.expected = {};	
	c.greaterThanOrEqual.expect(c.sut,arg,c.alias).return(c.expected);
	c.returned = c.sut.greaterThanOrEqual(arg,c.optionalAlias);
}

act.base = '../new';
module.exports = act;