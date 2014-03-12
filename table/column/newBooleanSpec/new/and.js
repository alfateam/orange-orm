var anded = {};

function act(c){
	c.expected = {};
	c.filter2 = {};
	c.filter.append = c.mock();
	c.filter.append.expect(' AND ').return(anded)
	anded.append = c.mock();
	anded.append.expect(c.filter2).return(c.expected);
	c.returned = c.sut.and(c.filter2);
}

module.exports = act;