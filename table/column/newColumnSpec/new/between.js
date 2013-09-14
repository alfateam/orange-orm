var mock = require('a').mock;
var from = 'from';
var to = 'to';
var fromFilter = {};
var toFilter = {};

function act(c) {
	c.expected = {};	
	fromFilter.and = mock();
	fromFilter.and.expect(toFilter).return(c.expected);
	c.lessThanOrEqual.expect(c.sut,to,c.alias).return(toFilter);
	c.greaterThanOrEqual.expect(c.sut,from,c.alias).return(fromFilter);	
	c.returned = c.sut.between(from,to,c.alias);
}

act.base = '../new';
module.exports = act;