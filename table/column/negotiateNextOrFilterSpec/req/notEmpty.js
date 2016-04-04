function act(c){	
	c.sql = 'not empty';
	c.tempFilter = {};
	c.tempFilter2 = {};
	c.tempFilter3 = {};
	c.filter2.sql.expect().return(c.sql);

	c.filter.prepend = c.mock();
	c.filter.prepend.expect('(').return(c.tempFilter)
	
	c.tempFilter.append = c.mock();
	c.tempFilter.append.expect(' OR ').return(c.tempFilter2);

	c.tempFilter2.append = c.mock();
	c.tempFilter2.append.expect(c.filter2).return(c.tempFilter3);	

	c.tempFilter3.append = c.mock();
	c.expected = {};
	c.tempFilter3.append.expect(')').return(c.expected);	
	
	c.returned = c.sut(c.filter, c.filter2);
}

module.exports = act;