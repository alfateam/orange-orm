function act(c){		
	c.expected = {};
	c.executeQuery.expect(c.rollbackCommand).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;