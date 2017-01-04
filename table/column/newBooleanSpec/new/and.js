var anded = {};
var tempFilter = {};
var filter2 = {};
var rawFilter2 = {};
var filter3 = {};
var nextBoolean = {};

function act(c){	
	c.expected = {};
		
	c.negotiateNextAndFilter.expect(c.filter, filter2).return(tempFilter)

	// c.filter.append = c.mock();
	// c.filter.append.expect(' AND ').return(anded)
	// anded.append = c.mock();
	// anded.append.expect(filter2).return(tempFilter);
	
	c.nextNewBoolean = c.requireMock('./newBoolean');
	c.nextNewBoolean.expect(tempFilter).return(nextBoolean);
	
	nextBoolean.and = c.mock();
	nextBoolean.and.expect(filter3).return(c.expected);

	c.negotiateRawSqlFilter.expect(rawFilter2).return(filter2);

	c.returned = c.sut.and(rawFilter2,filter3);
}

module.exports = act;