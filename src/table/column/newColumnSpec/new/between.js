var mock = require('a').mock;
var from = 'from';
var to = 'to';
var fromFilter = {};
var toFilter = {};

function act(c) {
	c.expected = {};	
	fromFilter.and = mock();
	fromFilter.and.expect(toFilter).return(c.expected);

	c.sut.lessThanOrEqual = mock();
	c.sut.lessThanOrEqual.expect(to, c.alias).return(toFilter);

	c.sut.greaterThanOrEqual = mock();
	c.sut.greaterThanOrEqual.expect(from, c.alias).return(fromFilter);
	
	c.returned = c.sut.between(from,to,c.optionalAlias);
}

act.base = '../new';
module.exports = act;