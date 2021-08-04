function act(c){	
	c.sql = 'not empty';
	c.filter2.sql.expect().return(c.sql);

	c.filter.append = c.mock();
	c.anded = {};
	c.filter.append.expect(' AND ').return(c.anded)

	c.anded.append = c.mock();
	c.expected = {};
	c.anded.append.expect(c.filter2).return(c.expected);
	
	c.returned = c.sut(c.filter, c.filter2);
}

module.exports = act;