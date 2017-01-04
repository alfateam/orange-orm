function act(c){
	c.query = {};
	c.options = {};

	c.expected = {};
	
	c.pendingQuery = {};
	c.pendingQuery.stream = c.mock();
	c.pendingQuery.stream.expect(c.options).return(c.expected);
	
	c.executeQuery.expect(c.query).return(c.pendingQuery)

	c.returned = c.sut(c.query, c.options);
}

module.exports = act;