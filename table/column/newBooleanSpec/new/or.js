var tempFilter = {};
var tempFilter2 = {};
var tempFilter3 = {};
var tempFilter4 = {};
var nextBoolean = {};
var filter2 = {};
var rawFilter2 = {};
var filter3 = {};

function act(c){
	c.expected = {};	
	c.filter.prepend = c.mock();
	c.filter.prepend.expect('(').return(tempFilter)
	
	tempFilter.append = c.mock();
	tempFilter.append.expect(' OR ').return(tempFilter2);

	tempFilter2.append = c.mock();
	tempFilter2.append.expect(filter2).return(tempFilter3);	

	tempFilter3.append = c.mock();
	tempFilter3.append.expect(')').return(tempFilter4);	

	c.nextNewBoolean = c.requireMock('./newBoolean');
	c.nextNewBoolean.expect(tempFilter4).return(nextBoolean);

	nextBoolean.or = c.mock();
	nextBoolean.or.expect(filter3).return(c.expected);

	c.negotiateRawSqlFilter.expect(rawFilter2).return(filter2);

	c.returned = c.sut.or(rawFilter2,filter3);
}

module.exports = act;