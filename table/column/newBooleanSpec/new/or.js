var tempFilter = {};
var tempFilter2 = {};
var tempFilter3 = {};

function act(c){
	c.expected = {};
	c.filter2 = {};
	c.filter.prepend = c.mock();
	c.filter.prepend.expect('(').return(tempFilter)
	
	tempFilter.append = c.mock();
	tempFilter.append.expect(' OR ').return(tempFilter2);

	tempFilter2.append = c.mock();
	tempFilter2.append.expect(c.filter2).return(tempFilter3);	

	tempFilter3.append = c.mock();
	tempFilter3.append.expect(')').return(c.expected);	

	c.returned = c.sut.or(c.filter2);
}

module.exports = act;