function act(c){
	c.query = {};

	c.expected = {};
	
	c.pendingQuery = {};
	c.pendingQuery.stream = c.mock();
	c.pendingQuery.stream.expect().return(c.expected);
	
	c.executeQuery.expect(c.query).return(c.pendingQuery)

	c.returned = c.sut(c.query);
}

module.exports = act;